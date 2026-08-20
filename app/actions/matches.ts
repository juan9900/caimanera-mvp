"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  CreateMatchFormSchema,
  type CreateMatchFormState,
} from "@/lib/matches/definitions";

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
    isPublic: formData.get("isPublic") === "true",
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
    isPublic,
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
      is_public: isPublic,
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

  revalidatePath(`/partidos/${matchId}`);
}

/**
 * Organizer invites specific users to a match — the only way in for a
 * PRIVATE match (see `setMatchVisibility`); public matches also offer this
 * alongside the "Unirse"/`joinMatch` flow, so the organizer can proactively
 * pull in friends instead of waiting to be discovered. Invited rows start
 * `invitado`, which the `recalc_match_slots` trigger ignores, so inviting
 * never occupies a slot — only `respondToInvitation` accepting one does.
 * Silently skips users who already have a participant row (any status)
 * instead of erroring, so re-running "invitar a todos mis amigos" after some
 * already accepted is harmless.
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
        organizer: match.organizer_id,
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

  revalidatePath(`/partidos/${matchId}`);
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
    .select("slots_filled, total_slots, status")
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
  const { error } = await supabase
    .from("match_participants")
    .update({ status: approve ? "confirmado" : "rechazado" })
    .eq("id", participantId);

  if (error) return { message: "No se pudo procesar la solicitud. Intenta de nuevo." };

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

  revalidatePath("/");
  revalidatePath("/partidos");
  revalidatePath(`/partidos/${matchId}`);
}

/**
 * Organizer toggles a match's visibility. Private matches are dropped from
 * the home/`/partidos` listings (see `getOpenMatches*`) and the detail page
 * no longer offers "Unirse" to non-invited users — the organizer must
 * `inviteToMatch` explicitly. Public matches keep both: anyone can request
 * to join (`joinMatch`, still needs approval) AND the organizer can invite.
 */
export async function setMatchVisibility(formData: FormData): Promise<MatchActionResult> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  const isPublic = formData.get("isPublic") === "true";
  if (typeof matchId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({ is_public: isPublic })
    .eq("id", matchId)
    .eq("organizer_id", session.userId);

  if (error) return { message: "No se pudo cambiar la visibilidad. Intenta de nuevo." };

  revalidatePath("/");
  revalidatePath("/partidos");
  revalidatePath(`/partidos/${matchId}`);
}

