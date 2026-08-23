import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Every event type a row in `notifications` can represent. */
export type NotificationType =
  | "join_request"
  | "request_approved"
  | "match_joined"
  | "invited_match"
  | "match_cancelled"
  | "match_reopened"
  | "match_updated"
  | "group_invited"
  | "group_joined"
  | "friend_request"
  | "friend_accepted"
  | "payment_reported"
  | "payment_confirmed";

export type PersistNotificationInput = {
  type: NotificationType;
  title: string;
  body: string;
  /** Deep-link opened when the notification is tapped, e.g. `/partidos/<id>`. */
  url?: string;
  /** Who triggered the event, if any — excluded from its own recipient list. */
  actorId?: string;
};

/**
 * Writes one row per recipient into `notifications`, in-app counterpart to
 * the push sent alongside it. Best-effort like `notifyUsers`: runs after the
 * triggering write has already succeeded and never throws — a notification
 * that fails to save must never surface as a failed action.
 *
 * Uses the service-role client because writing a notification means
 * inserting a row owned by someone else, and `notifications` deliberately
 * has no INSERT policy for regular clients (mirrors how push delivery reads
 * other users' `push_subscriptions`). Degrades to a no-op when the
 * service-role key isn't configured.
 */
export async function persistNotifications(
  recipientIds: string[],
  input: PersistNotificationInput
): Promise<void> {
  const ids = Array.from(new Set(recipientIds.filter(Boolean))).filter(
    (id) => id !== input.actorId
  );
  if (ids.length === 0) return;

  const admin = createAdminClient();
  if (!admin) {
    console.warn(
      "[notifications] falta SUPABASE_SERVICE_ROLE_KEY; no se guardan notificaciones in-app"
    );
    return;
  }

  const { error } = await admin.from("notifications").insert(
    ids.map((userId) => ({
      user_id: userId,
      type: input.type,
      title: input.title,
      body: input.body,
      url: input.url ?? null,
      actor_id: input.actorId ?? null,
    }))
  );

  if (error) {
    console.warn("[notifications] no se pudieron guardar", error.message);
  }
}
