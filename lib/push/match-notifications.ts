import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SPORT_LABELS } from "@/lib/matches/home";
import { notifyAndPersist, notifyMatchAudience } from "@/lib/push/send";

type Client = SupabaseClient<Database>;

/**
 * Copy and recipient lookup for every push the match flow sends, kept out of
 * `app/actions/matches.ts` so the actions stay about the write they perform.
 *
 * All of these are best-effort: they run after their action's write has
 * already succeeded, and none of them throw — a notification that doesn't go
 * out must never surface to the user as a failed action.
 */

function matchUrl(matchId: string): string {
  return `/partidos/${matchId}`;
}

export function sportLabel(sport: string): string {
  return SPORT_LABELS[sport] ?? sport;
}

/** Court name for a match, or a neutral fallback when it can't be read. */
async function getCourtName(supabase: Client, courtId: string): Promise<string> {
  const { data } = await supabase.from("courts").select("name").eq("id", courtId).maybeSingle();
  return data?.name ?? "una cancha cercana";
}

/** Confirmed players of a match, minus whoever triggered the change. */
export async function getConfirmedUserIds(
  supabase: Client,
  matchId: string,
  excludeUserId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("match_participants")
    .select("user_id")
    .eq("match_id", matchId)
    .eq("status", "confirmado");

  return (data ?? []).map((row) => row.user_id).filter((id) => id !== excludeUserId);
}

/**
 * A new public match still short of players — the "faltan jugadores" case.
 * Private matches are deliberately excluded: they have no audience channel by
 * design (the detail page nudges the organizer to go public instead).
 */
export async function notifyNewPublicMatch(
  supabase: Client,
  match: { id: string; courtId: string; sport: string; totalSlots: number }
): Promise<void> {
  const courtName = await getCourtName(supabase, match.courtId);
  // The organizer already occupies one slot at creation time.
  const needed = Math.max(match.totalSlots - 1, 0);

  await notifyMatchAudience(supabase, match.id, {
    title: `Falta gente para una caimanera en ${courtName}`,
    body:
      needed === 1
        ? `${sportLabel(match.sport)} · falta 1 jugador`
        : `${sportLabel(match.sport)} · faltan ${needed} jugadores`,
    url: matchUrl(match.id),
  });
}

/** Someone asked to join — only the organizer can approve, so only they hear about it. */
export async function notifyJoinRequest(
  supabase: Client,
  matchId: string,
  organizerId: string,
  requesterName: string | null
): Promise<void> {
  await notifyAndPersist(
    supabase,
    [organizerId],
    {
      title: "Alguien quiere unirse a tu partido",
      body: `${requesterName ?? "Un jugador"} pidió unirse. Entra para aceptarlo o rechazarlo.`,
      url: matchUrl(matchId),
    },
    "join_request"
  );
}

/** The organizer approved a pending join request. */
export async function notifyRequestApproved(
  supabase: Client,
  matchId: string,
  userId: string
): Promise<void> {
  await notifyAndPersist(
    supabase,
    [userId],
    {
      title: "¡Estás dentro!",
      body: "El organizador aceptó tu solicitud. Nos vemos en la cancha.",
      url: matchUrl(matchId),
    },
    "request_approved"
  );
}

/** An invitee accepted their invitation and is now confirmed — the organizer already
 * decided by inviting, but still wants to know when someone actually joins. */
export async function notifyMatchJoined(
  supabase: Client,
  matchId: string,
  organizerId: string,
  joinerName: string | null
): Promise<void> {
  await notifyAndPersist(
    supabase,
    [organizerId],
    {
      title: "Se sumó un jugador a tu partido",
      body: `${joinerName ?? "Un jugador"} aceptó tu invitación y ya está confirmado.`,
      url: matchUrl(matchId),
    },
    "match_joined"
  );
}

/** The organizer invited specific players. */
export async function notifyInvited(
  supabase: Client,
  matchId: string,
  userIds: string[],
  organizerName: string | null
): Promise<void> {
  await notifyAndPersist(
    supabase,
    userIds,
    {
      title: "Te invitaron a una caimanera",
      body: `${organizerName ?? "Un organizador"} te invitó a jugar. Entra para aceptar.`,
      url: matchUrl(matchId),
    },
    "invited_match"
  );
}

/** The organizer cancelled the match — everyone who was confirmed needs to know. */
export async function notifyMatchCancelled(
  supabase: Client,
  matchId: string,
  organizerId: string
): Promise<void> {
  const userIds = await getConfirmedUserIds(supabase, matchId, organizerId);

  await notifyAndPersist(
    supabase,
    userIds,
    {
      title: "Se canceló un partido",
      body: "El organizador canceló la caimanera en la que estabas confirmado.",
      url: matchUrl(matchId),
    },
    "match_cancelled",
    organizerId
  );
}

/** The organizer reopened an expired match to look for more players. */
export async function notifyMatchReopened(
  supabase: Client,
  matchId: string,
  organizerId: string
): Promise<void> {
  const userIds = await getConfirmedUserIds(supabase, matchId, organizerId);

  await notifyAndPersist(
    supabase,
    userIds,
    {
      title: "Se reabrió un partido",
      body: "El organizador reabrió la caimanera para buscar más jugadores.",
      url: matchUrl(matchId),
    },
    "match_reopened",
    organizerId
  );
}

/**
 * The organizer edited one or more base fields of the match (date/time,
 * court, sport, vibe, slots) — confirmed players need to know, since it
 * changes what they signed up for. `changes` is a list of human-readable
 * labels (e.g. ["fecha y hora", "cancha"]) built by the caller from the diff.
 */
export async function notifyMatchUpdated(
  supabase: Client,
  matchId: string,
  organizerId: string,
  changes: string[]
): Promise<void> {
  if (changes.length === 0) return;

  const userIds = await getConfirmedUserIds(supabase, matchId, organizerId);
  if (userIds.length === 0) return;

  await notifyAndPersist(
    supabase,
    userIds,
    {
      title: "Cambió un partido",
      body:
        changes.length === 1
          ? `El organizador actualizó: ${changes[0]}.`
          : `El organizador actualizó: ${changes.join(", ")}.`,
      url: matchUrl(matchId),
    },
    "match_updated",
    organizerId
  );
}
