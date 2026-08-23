import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getConfirmedUserIds, sportLabel } from "@/lib/push/match-notifications";
import { notifyUsers } from "@/lib/push/send";

type Client = SupabaseClient<Database>;

/**
 * A chat message was sent — push-only, no in-app row (unlike
 * `notifyAndPersist`): a feed entry per message would drown out the rest of
 * `/notificaciones`, same reasoning as `notifyMatchAudience`. Destinatarios:
 * todos los confirmados salvo quien escribió — el organizador ya tiene su
 * propia fila `confirmado` desde que crea el partido (ver `createMatch`), así
 * que `getConfirmedUserIds` ya lo incluye sin necesitar una consulta aparte.
 */
export async function notifyMatchChat(
  supabase: Client,
  matchId: string,
  senderId: string,
  senderName: string | null,
  body: string
): Promise<void> {
  const { data: match } = await supabase
    .from("matches")
    .select("sport")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return;

  const recipients = await getConfirmedUserIds(supabase, matchId, senderId);
  if (recipients.length === 0) return;

  await notifyUsers(supabase, recipients, {
    title: `Nuevo mensaje · ${sportLabel(match.sport)}`,
    body: `${senderName ?? "Un jugador"}: ${body}`,
    url: `/partidos/${matchId}`,
  });
}
