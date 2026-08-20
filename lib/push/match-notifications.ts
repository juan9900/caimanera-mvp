import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SPORT_LABELS } from "@/lib/matches/home";
import { notifyMatchAudience, notifyUsers } from "@/lib/push/send";

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

function sportLabel(sport: string): string {
  return SPORT_LABELS[sport] ?? sport;
}

/** Court name for a match, or a neutral fallback when it can't be read. */
async function getCourtName(supabase: Client, courtId: string): Promise<string> {
  const { data } = await supabase.from("courts").select("name").eq("id", courtId).maybeSingle();
  return data?.name ?? "una cancha cercana";
}

/** Confirmed players of a match, minus whoever triggered the change. */
async function getConfirmedUserIds(
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
  matchId: string,
  organizerId: string,
  requesterName: string | null
): Promise<void> {
  await notifyUsers([organizerId], {
    title: "Alguien quiere unirse a tu partido",
    body: `${requesterName ?? "Un jugador"} pidió unirse. Entrá para aceptarlo o rechazarlo.`,
    url: matchUrl(matchId),
  });
}

/** The organizer approved a pending join request. */
export async function notifyRequestApproved(
  matchId: string,
  userId: string
): Promise<void> {
  await notifyUsers([userId], {
    title: "¡Estás dentro!",
    body: "El organizador aceptó tu solicitud. Nos vemos en la cancha.",
    url: matchUrl(matchId),
  });
}

/** The organizer invited specific players. */
export async function notifyInvited(
  matchId: string,
  userIds: string[],
  organizerName: string | null
): Promise<void> {
  await notifyUsers(userIds, {
    title: "Te invitaron a una caimanera",
    body: `${organizerName ?? "Un organizador"} te invitó a jugar. Entrá para aceptar.`,
    url: matchUrl(matchId),
  });
}

/** The organizer cancelled the match — everyone who was confirmed needs to know. */
export async function notifyMatchCancelled(
  supabase: Client,
  matchId: string,
  organizerId: string
): Promise<void> {
  const userIds = await getConfirmedUserIds(supabase, matchId, organizerId);

  await notifyUsers(userIds, {
    title: "Se canceló un partido",
    body: "El organizador canceló la caimanera en la que estabas confirmado.",
    url: matchUrl(matchId),
  });
}

/** The organizer reopened an expired match to look for more players. */
export async function notifyMatchReopened(
  supabase: Client,
  matchId: string,
  organizerId: string
): Promise<void> {
  const userIds = await getConfirmedUserIds(supabase, matchId, organizerId);

  await notifyUsers(userIds, {
    title: "Se reabrió un partido",
    body: "El organizador reabrió la caimanera para buscar más jugadores.",
    url: matchUrl(matchId),
  });
}
