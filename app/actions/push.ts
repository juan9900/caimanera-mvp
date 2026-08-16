"use server";

import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { PushSubscriptionSchema } from "@/lib/push/definitions";

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
