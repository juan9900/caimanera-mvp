"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import webpush from "web-push";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  CreateMatchFormSchema,
  type CreateMatchFormState,
} from "@/lib/matches/definitions";
import { AUDIENCE_SCOPES, type AudienceScope } from "@/lib/push/definitions";

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

  const { data, error } = await supabase
    .from("matches")
    .insert({
      court_id: courtId,
      sport,
      datetime: datetime.toISOString(),
      vibe,
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

/** Joins the current user into a match, as direct network or external, per `is_direct_network`. */
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

  const { error } = await supabase.from("match_participants").insert(
    isDirectNetwork
      ? { match_id: matchId, user_id: session.userId, status: "confirmado", joined_via: "red_directa" }
      : { match_id: matchId, user_id: session.userId, status: "pendiente", joined_via: "externo" }
  );

  if (error) return { message: "No se pudo unir al partido. Intenta de nuevo." };

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
 * the home/`/partidos` listings (see `getOpenMatches*`) but the detail page
 * stays reachable by direct link — join requests still go through the usual
 * direct-network/pending flow, so "private" means "invite-only", not a
 * separate access-control layer.
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

export type NotifyResult = { message: string; ok: boolean };

const AUDIENCE_LABELS: Record<AudienceScope, string> = {
  red: "tu red",
  amigos: "amigos de amigos",
  canchas: "canchas donde juegas",
};

/** Organizer pushes a "necesito más gente" alert to a chosen audience. */
export async function notifyNeedPlayers(formData: FormData): Promise<NotifyResult> {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  const scope = formData.get("scope");

  if (typeof matchId !== "string" || typeof scope !== "string") {
    return { message: "Solicitud inválida.", ok: false };
  }
  if (!AUDIENCE_SCOPES.includes(scope as AudienceScope)) {
    return { message: "Elige una audiencia válida.", ok: false };
  }

  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("organizer_id, datetime, court:courts(name)")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { message: "El partido ya no existe.", ok: false };
  if (match.organizer_id !== session.userId) {
    return { message: "Solo el organizador puede avisar.", ok: false };
  }

  const { data: subscriptions, error } = await supabase.rpc(
    "resolve_audience_subscriptions",
    { p_match_id: matchId, p_scope: scope }
  );

  if (error) return { message: "No se pudo resolver la audiencia.", ok: false };
  if (!subscriptions || subscriptions.length === 0) {
    return {
      message: `Nadie en ${AUDIENCE_LABELS[scope as AudienceScope]} tiene notificaciones activadas.`,
      ok: false,
    };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return { message: "Las notificaciones no están configuradas.", ok: false };
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const courtName = (match.court as { name: string } | null)?.name ?? "la cancha";
  const payload = JSON.stringify({
    title: "Falta gente para una caimanera",
    body: `Se necesitan jugadores en ${courtName}.`,
    url: `/partidos/${matchId}`,
  });

  const deadEndpoints: string[] = [];
  let sent = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          deadEndpoints.push(sub.endpoint);
        }
        console.error("[notifyNeedPlayers] push send failed", statusCode, err);
      }
    })
  );

  if (deadEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
  }

  if (sent === 0) {
    return {
      message: "No se pudo entregar el aviso a nadie. Revisa la consola del servidor.",
      ok: false,
    };
  }

  return {
    message: `Aviso enviado a ${sent} jugador(es) de ${AUDIENCE_LABELS[scope as AudienceScope]}.`,
    ok: true,
  };
}
