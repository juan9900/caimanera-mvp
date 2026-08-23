import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { notifyAndPersist } from "@/lib/push/send";

type Client = SupabaseClient<Database>;

function matchUrl(matchId: string): string {
  return `/partidos/${matchId}`;
}

/** A player reported their payment — the organizer needs to verify it. */
export async function notifyPaymentReported(
  supabase: Client,
  matchId: string,
  organizerId: string,
  payerName: string | null,
  reference: string
): Promise<void> {
  await notifyAndPersist(
    supabase,
    [organizerId],
    {
      title: "Te notificaron un pago",
      body: `${payerName ?? "Un jugador"} dice que pagó su cupo. Referencia: ${reference}.`,
      url: matchUrl(matchId),
    },
    "payment_reported"
  );
}

/** The organizer confirmed (or manually marked) a participant's payment. */
export async function notifyPaymentConfirmed(
  supabase: Client,
  matchId: string,
  userId: string
): Promise<void> {
  await notifyAndPersist(
    supabase,
    [userId],
    {
      title: "Tu pago fue confirmado",
      body: "El organizador confirmó que ya pagaste tu cupo.",
      url: matchUrl(matchId),
    },
    "payment_confirmed"
  );
}
