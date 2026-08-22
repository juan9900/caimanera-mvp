"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUserProfile, getGroupMemberIds, requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  CreateMatchFormSchema,
  UpdateMatchFormSchema,
  type CreateMatchFormState,
  type UpdateMatchFormState,
} from "@/lib/matches/definitions";
import {
  notifyInvited,
  notifyJoinRequest,
  notifyMatchCancelled,
  notifyMatchJoined,
  notifyMatchReopened,
  notifyMatchUpdated,
  notifyNewPublicMatch,
  notifyRequestApproved,
} from "@/lib/push/match-notifications";

export async function createMatch(
  _state: CreateMatchFormState,
  formData: FormData
): Promise<CreateMatchFormState> {
  const session = await requireSession();

  const validatedFields = CreateMatchFormSchema.safeParse({
    courtId: formData.get("courtId"),
    sport: formData.get("sport"),
    datetime: formData.get("datetime"),
    vibe: formData.get("vibe"),
    visibility: formData.get("visibility") ?? undefined,
    notifyAudience: formData.get("notifyAudience") === "true",
    totalSlots: formData.get("totalSlots"),
    paymentBank: formData.get("paymentBank"),
    paymentPhone: formData.get("paymentPhone"),
    paymentCedula: formData.get("paymentCedula"),
    paymentAmountBs: formData.get("paymentAmountBs"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    courtId,
    sport,
    datetime,
    vibe,
    visibility,
    notifyAudience,
    totalSlots,
    paymentBank,
    paymentPhone,
    paymentCedula,
    paymentAmountBs,
  } = validatedFields.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .insert({
      court_id: courtId,
      sport,
      datetime: datetime.toISOString(),
      vibe,
      visibility,
      total_slots: totalSlots,
      organizer_id: session.userId,
      payment_bank: paymentBank ?? null,
      payment_phone: paymentPhone ?? null,
      payment_cedula: paymentCedula ?? null,
      payment_amount_bs: paymentAmountBs ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { message: "No se pudo crear el partido. Intenta de nuevo." };
  }

  await supabase.from("match_participants").insert({
    match_id: data.id,
    user_id: session.userId,
    status: "confirmado",
    joined_via: "red_directa",
  });

  // Attribution for sponsored courts: a match created here is the conversion
  // a court's monthly sponsorship is meant to earn. Best-effort — never block
  // match creation on it.
  await supabase.rpc("log_court_event", { p_court_id: courtId, p_type: "match_created" });

  // "Faltan jugadores": tell the audience a new match needs people. Opt-in —
  // creating a match is not on its own a reason to interrupt everyone's phone,
  // so the organizer has to ask for it. Public only: "amigos"/"privada"
  // matches have no audience channel by design. Must run before the redirect
  // below, which throws to unwind the action.
  if (visibility === "publica" && notifyAudience) {
    await notifyNewPublicMatch(supabase, {
      id: data.id,
      courtId,
      sport,
      totalSlots,
    });
  }

  redirect(`/partidos/${data.id}`);
}

export type MatchActionResult = { message: string } | void;

/**
 * Requests to join a match. Every join request starts `pendiente` — the
 * organizer must approve it regardless of visibility (public/private) or
 * network. `joined_via` (`red_directa`/`externo`, per `is_direct_network`)
 * is kept purely as an informational badge for the organizer, it no longer
 * grants auto-confirmation (enforced by the `match_participants` RLS insert
 * policy too, not just here).
 */
export async function joinMatch(formData: FormData): Promise<MatchActionResult> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  if (typeof matchId !== "string") return;

  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("organizer_id")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { message: "El partido ya no existe." };

  const { data: isDirectNetwork } = await supabase.rpc("is_direct_network", {
    organizer: match.organizer_id,
    candidate: session.userId,
  });

  const { error } = await supabase.from("match_participants").insert({
    match_id: matchId,
    user_id: session.userId,
    status: "pendiente",
    joined_via: isDirectNetwork ? "red_directa" : "externo",
  });

  if (error) return { message: "No se pudo unir al partido. Intenta de nuevo." };

  const profile = await getCurrentUserProfile();
  await notifyJoinRequest(supabase, matchId, match.organizer_id, profile?.name ?? null);

  revalidatePath(`/partidos/${matchId}`);
}

/**
 * Shared by `inviteToMatch` and `inviteGroupToMatch` once the caller has
 * already been confirmed as the organizer: skips users who already have a
 * participant row (any status), so re-running an invite after some already
 * accepted is harmless, then inserts `invitado` rows and notifies.
 */
async function inviteUserIdsToMatch(
  supabase: SupabaseClient<Database>,
  matchId: string,
  organizerId: string,
  userIds: string[]
): Promise<MatchActionResult> {
  const { data: existing } = await supabase
    .from("match_participants")
    .select("user_id")
    .eq("match_id", matchId)
    .in("user_id", userIds);

  const existingIds = new Set((existing ?? []).map((p) => p.user_id));
  const toInvite = userIds.filter((id) => !existingIds.has(id));

  if (toInvite.length === 0) {
    revalidatePath(`/partidos/${matchId}`);
    return;
  }

  const rows = await Promise.all(
    toInvite.map(async (userId) => {
      const { data: isDirectNetwork } = await supabase.rpc("is_direct_network", {
        organizer: organizerId,
        candidate: userId,
      });
      return {
        match_id: matchId,
        user_id: userId,
        status: "invitado" as const,
        joined_via: isDirectNetwork ? ("red_directa" as const) : ("externo" as const),
      };
    }),
  );

  const { error } = await supabase.from("match_participants").insert(rows);

  if (error) return { message: "No se pudo invitar a los jugadores. Intenta de nuevo." };

  const profile = await getCurrentUserProfile();
  await notifyInvited(supabase, matchId, toInvite, profile?.name ?? null);

  revalidatePath(`/partidos/${matchId}`);
}

/**
 * Organizer invites specific users to a match — the only way in for a
 * PRIVATE match (see `setMatchVisibility`); public matches also offer this
 * alongside the "Unirse"/`joinMatch` flow, so the organizer can proactively
 * pull in friends instead of waiting to be discovered. Invited rows start
 * `invitado`, which the `recalc_match_slots` trigger ignores, so inviting
 * never occupies a slot — only `respondToInvitation` accepting one does.
 */
export async function inviteToMatch(formData: FormData): Promise<MatchActionResult> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  const userIdsRaw = formData.get("userIds");
  if (typeof matchId !== "string" || typeof userIdsRaw !== "string") return;

  const userIds = Array.from(
    new Set(
      userIdsRaw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ).filter((id) => id !== session.userId);

  if (userIds.length === 0) return { message: "Selecciona al menos un jugador." };

  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("organizer_id")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { message: "El partido ya no existe." };
  if (match.organizer_id !== session.userId) {
    return { message: "Solo el organizador puede invitar." };
  }

  return inviteUserIdsToMatch(supabase, matchId, match.organizer_id, userIds);
}

/**
 * Organizer invites every accepted member of one of their own groups in a
 * single click. Membership is resolved via `getGroupMemberIds`, whose RLS
 * already requires the caller to belong to the group, so no extra
 * membership check is needed here.
 */
export async function inviteGroupToMatch(formData: FormData): Promise<MatchActionResult> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  const groupId = formData.get("groupId");
  if (typeof matchId !== "string" || typeof groupId !== "string") return;

  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("organizer_id")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { message: "El partido ya no existe." };
  if (match.organizer_id !== session.userId) {
    return { message: "Solo el organizador puede invitar." };
  }

  const memberIds = await getGroupMemberIds(groupId);
  const userIds = memberIds.filter((id) => id !== session.userId);

  if (userIds.length === 0) {
    return { message: "No pudimos leer los miembros de ese grupo." };
  }

  return inviteUserIdsToMatch(supabase, matchId, match.organizer_id, userIds);
}

/**
 * Invitee accepts or rejects their own invitation. Accepting confirms the
 * slot directly (no organizer approval, unlike `respondToRequest`) — the
 * organizer already decided by inviting. Rejecting deletes the row so the
 * organizer can invite again later. The slot-count guard here mirrors what
 * the RLS UPDATE policy can't express (it only checks ownership/status).
 */
export async function respondToInvitation(formData: FormData): Promise<MatchActionResult> {
  const session = await requireSession();
  const participantId = formData.get("participantId");
  const matchId = formData.get("matchId");
  const accept = formData.get("accept") === "true";
  if (typeof participantId !== "string" || typeof matchId !== "string") return;

  const supabase = await createClient();

  if (!accept) {
    const { error } = await supabase
      .from("match_participants")
      .delete()
      .eq("id", participantId)
      .eq("user_id", session.userId)
      .eq("status", "invitado");

    if (error) return { message: "No se pudo rechazar la invitación. Intenta de nuevo." };

    revalidatePath("/");
    revalidatePath("/invitaciones");
    revalidatePath(`/partidos/${matchId}`);
    return;
  }

  const { data: match } = await supabase
    .from("matches")
    .select("slots_filled, total_slots, status, organizer_id")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { message: "El partido ya no existe." };
  if (match.status !== "abierto") return { message: "Este partido ya no está abierto." };
  if (match.slots_filled >= match.total_slots) {
    return { message: "El partido ya está lleno." };
  }

  const { error } = await supabase
    .from("match_participants")
    .update({ status: "confirmado" })
    .eq("id", participantId)
    .eq("user_id", session.userId)
    .eq("status", "invitado");

  if (error) return { message: "No se pudo aceptar la invitación. Intenta de nuevo." };

  const profile = await getCurrentUserProfile();
  await notifyMatchJoined(supabase, matchId, match.organizer_id, profile?.name ?? null);

  revalidatePath("/");
  revalidatePath("/invitaciones");
  revalidatePath(`/partidos/${matchId}`);
}

/** Removes the current user's own participation from a match. */
export async function leaveMatch(formData: FormData): Promise<MatchActionResult> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  if (typeof matchId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("match_participants")
    .delete()
    .eq("match_id", matchId)
    .eq("user_id", session.userId);

  if (error) return { message: "No se pudo completar la acción. Intenta de nuevo." };

  revalidatePath(`/partidos/${matchId}`);
}

/** Organizer approves or rejects a pending join request. */
export async function respondToRequest(formData: FormData): Promise<MatchActionResult> {
  await requireSession();
  const participantId = formData.get("participantId");
  const matchId = formData.get("matchId");
  const approve = formData.get("approve") === "true";
  if (typeof participantId !== "string" || typeof matchId !== "string") return;

  const supabase = await createClient();
  const { data: participant, error } = await supabase
    .from("match_participants")
    .update({ status: approve ? "confirmado" : "rechazado" })
    .eq("id", participantId)
    .select("user_id")
    .maybeSingle();

  if (error) return { message: "No se pudo procesar la solicitud. Intenta de nuevo." };

  // Only the good news is worth a push; a rejection is visible in the app.
  if (approve && participant) {
    await notifyRequestApproved(supabase, matchId, participant.user_id);
  }

  revalidatePath(`/partidos/${matchId}`);
}

/** Organizer removes a participant from a match. */
export async function removeParticipant(formData: FormData): Promise<MatchActionResult> {
  await requireSession();
  const participantId = formData.get("participantId");
  const matchId = formData.get("matchId");
  if (typeof participantId !== "string" || typeof matchId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase.from("match_participants").delete().eq("id", participantId);

  if (error) return { message: "No se pudo quitar al participante. Intenta de nuevo." };

  revalidatePath(`/partidos/${matchId}`);
}

/** Organizer cancels their own match. */
export async function cancelMatch(formData: FormData): Promise<MatchActionResult> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  if (typeof matchId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({ status: "cancelado" })
    .eq("id", matchId)
    .eq("organizer_id", session.userId);

  if (error) return { message: "No se pudo cancelar el partido. Intenta de nuevo." };

  await notifyMatchCancelled(supabase, matchId, session.userId);

  revalidatePath(`/partidos/${matchId}`);
}

/**
 * Organizer reopens a match that auto-expired (status "vencido") to ask for
 * more players. Keeps the original `datetime` (shown in red as "ya comenzó"
 * on the home screen) and stamps `reopened_at` so the expiry cron job
 * (`expire-started-matches`) gives it one more hour of visibility before
 * expiring it again.
 */
export async function reopenMatch(formData: FormData): Promise<MatchActionResult> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  if (typeof matchId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({ status: "abierto", reopened_at: new Date().toISOString() })
    .eq("id", matchId)
    .eq("organizer_id", session.userId)
    .eq("status", "vencido");

  if (error) return { message: "No se pudo reabrir el partido. Intenta de nuevo." };

  await notifyMatchReopened(supabase, matchId, session.userId);

  revalidatePath("/");
  revalidatePath("/partidos");
  revalidatePath(`/partidos/${matchId}`);
}

const MATCH_VISIBILITY_VALUES = ["publica", "amigos", "privada"] as const;

/**
 * Organizer sets a match's visibility level. "privada" is dropped from the
 * home/`/partidos` listings and the friends' feed (see `getOpenMatches*`,
 * `getFriendsMatches`), and the detail page no longer offers "Unirse" to
 * non-invited users — the organizer must `inviteToMatch` explicitly.
 * "amigos" is dropped from `/partidos`/the open feed but still shown to the
 * organizer's friends, who can request to join like on a public match.
 * "publica" appears everywhere and keeps both: anyone can request to join
 * (`joinMatch`, still needs approval) AND the organizer can invite.
 */
export async function setMatchVisibility(formData: FormData): Promise<MatchActionResult> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  const visibilityRaw = formData.get("visibility");
  if (typeof matchId !== "string") return;

  const values: readonly string[] = MATCH_VISIBILITY_VALUES;
  if (typeof visibilityRaw !== "string" || !values.includes(visibilityRaw)) {
    return { message: "Visibilidad inválida." };
  }
  const visibility = visibilityRaw as (typeof MATCH_VISIBILITY_VALUES)[number];

  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({ visibility })
    .eq("id", matchId)
    .eq("organizer_id", session.userId);

  if (error) return { message: "No se pudo cambiar la visibilidad. Intenta de nuevo." };

  revalidatePath("/");
  revalidatePath("/partidos");
  revalidatePath(`/partidos/${matchId}`);
}

const EDITABLE_MATCH_STATUSES = ["abierto", "completo"] as const;

/** Human-readable labels for the fields `updateMatch` diffs, used in the push copy. */
const UPDATE_FIELD_LABELS: Record<string, string> = {
  datetime: "fecha y hora",
  court_id: "cancha",
  sport: "deporte",
  vibe: "vibra",
  total_slots: "cupos",
};

/**
 * Organizer edits the base fields of their own match (court, sport,
 * date/time, vibe, slots, payment details). Visibility has its own form
 * (`setMatchVisibility`) and isn't part of this one. Only "abierto"/"completo"
 * matches can be edited — a cancelled or expired match has nothing left to
 * schedule. Confirmed players are notified of whichever of the
 * player-facing fields (date/time, court, sport, vibe, slots) actually
 * changed; payment detail edits don't trigger a push since they're not part
 * of the diff below.
 */
export async function updateMatch(
  _state: UpdateMatchFormState,
  formData: FormData
): Promise<UpdateMatchFormState> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  if (typeof matchId !== "string") return { message: "Partido inválido." };

  const validatedFields = UpdateMatchFormSchema.safeParse({
    courtId: formData.get("courtId"),
    sport: formData.get("sport"),
    datetime: formData.get("datetime"),
    vibe: formData.get("vibe"),
    totalSlots: formData.get("totalSlots"),
    paymentBank: formData.get("paymentBank"),
    paymentPhone: formData.get("paymentPhone"),
    paymentCedula: formData.get("paymentCedula"),
    paymentAmountBs: formData.get("paymentAmountBs"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    courtId,
    sport,
    datetime,
    vibe,
    totalSlots,
    paymentBank,
    paymentPhone,
    paymentCedula,
    paymentAmountBs,
  } = validatedFields.data;

  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("organizer_id, status, slots_filled, court_id, sport, datetime, vibe, total_slots")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { message: "El partido ya no existe." };
  if (match.organizer_id !== session.userId) {
    return { message: "Solo el organizador puede editar este partido." };
  }
  const editableStatuses: readonly string[] = EDITABLE_MATCH_STATUSES;
  if (!editableStatuses.includes(match.status)) {
    return { message: "Este partido ya no se puede editar." };
  }
  if (totalSlots < match.slots_filled) {
    return {
      errors: {
        totalSlots: [
          `No puedes bajar los cupos por debajo de los confirmados (${match.slots_filled}).`,
        ],
      },
    };
  }

  const { error } = await supabase
    .from("matches")
    .update({
      court_id: courtId,
      sport,
      datetime: datetime.toISOString(),
      vibe,
      total_slots: totalSlots,
      payment_bank: paymentBank ?? null,
      payment_phone: paymentPhone ?? null,
      payment_cedula: paymentCedula ?? null,
      payment_amount_bs: paymentAmountBs ?? null,
    })
    .eq("id", matchId)
    .eq("organizer_id", session.userId);

  if (error) return { message: "No se pudo actualizar el partido. Intenta de nuevo." };

  const changedFields: string[] = [];
  if (new Date(match.datetime).getTime() !== datetime.getTime()) changedFields.push("datetime");
  if (match.court_id !== courtId) changedFields.push("court_id");
  if (match.sport !== sport) changedFields.push("sport");
  if (match.vibe !== vibe) changedFields.push("vibe");
  if (match.total_slots !== totalSlots) changedFields.push("total_slots");

  if (changedFields.length > 0) {
    await notifyMatchUpdated(
      supabase,
      matchId,
      session.userId,
      changedFields.map((field) => UPDATE_FIELD_LABELS[field]),
    );
  }

  revalidatePath("/");
  revalidatePath("/partidos");
  revalidatePath(`/partidos/${matchId}`);
  redirect(`/partidos/${matchId}`);
}

