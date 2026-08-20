"use server";

import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { PushSubscriptionSchema } from "@/lib/push/definitions";
import { sendPushToSubscriptions } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";

/** Saves (or refreshes) the current user's Web Push subscription. */
export async function savePushSubscription(
  subscription: unknown
): Promise<{ message?: string }> {
  const session = await requireSession();

  const parsed = PushSubscriptionSchema.safeParse(subscription);
  if (!parsed.success) {
    return { message: "No se pudo activar las notificaciones." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: session.userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { message: "No se pudo activar las notificaciones." };

  return {};
}

/** Removes a Web Push subscription belonging to the current user. */
export async function deletePushSubscription(
  endpoint: string
): Promise<{ message?: string }> {
  const session = await requireSession();

  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", session.userId);

  if (error) return { message: "No se pudo desactivar las notificaciones." };

  return {};
}

/**
 * Sends a notification to the current user's own devices. This is the only
 * way to check the whole chain — permission, subscription, VAPID keys, service
 * worker — from the phone itself, without waiting for someone else to create a
 * match. Reads through the request-scoped client on purpose: RLS already
 * limits it to the caller's own subscriptions.
 */
export async function sendTestNotification(): Promise<{ message: string }> {
  const session = await requireSession();

  const supabase = await createClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", session.userId);

  if (!data || data.length === 0) {
    return { message: "Este dispositivo no está suscrito todavía." };
  }

  await sendPushToSubscriptions(data, {
    title: "Caimanera",
    body: "Notificación de prueba: todo funciona.",
    url: "/",
  });

  return { message: "Notificación enviada. Debería llegarte en unos segundos." };
}

export type PushDiagnostics = {
  vapidConfigured: boolean;
  serviceRoleConfigured: boolean;
  ownSubscriptions: number;
  /** Whether subscriptions of *other* users are readable with this session. */
  canReachOtherUsers: boolean;
};

/**
 * Reports why push delivery is (or isn't) working, from the device asking.
 *
 * The failure modes live in server env vars and RLS policies, neither of which
 * is visible from a phone — which is exactly where the app gets tested. Returns
 * booleans about configuration and a count of the caller's own rows; never a
 * key, an endpoint, or anything about another user.
 */
export async function getPushDiagnostics(): Promise<PushDiagnostics> {
  const session = await requireSession();
  const supabase = await createClient();

  const { count: ownCount } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId);

  const { count: otherCount } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .neq("user_id", session.userId);

  return {
    vapidConfigured: Boolean(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
    ),
    serviceRoleConfigured: createAdminClient() !== null,
    ownSubscriptions: ownCount ?? 0,
    canReachOtherUsers: (otherCount ?? 0) > 0,
  };
}
