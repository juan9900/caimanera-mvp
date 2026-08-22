import "server-only";

import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { AUDIENCE_SCOPES } from "@/lib/push/definitions";
import { persistNotifications, type NotificationType } from "@/lib/notifications/create";

type Client = SupabaseClient<Database>;

/** A subscription as stored in `push_subscriptions`. */
export type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** What `public/sw.js` expects to find in the push event payload. */
export type PushPayload = {
  title: string;
  body: string;
  /** Path opened when the notification is tapped. */
  url?: string;
};

let configured: boolean | null = null;

/**
 * Web Push signs every request with the VAPID pair. Resolved lazily (and
 * once) so importing this module never throws on a deployment that hasn't set
 * the keys yet — sending just becomes a no-op with a warning.
 */
function ensureConfigured(): boolean {
  if (configured !== null) return configured;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hola@kancha.app";

  if (!publicKey || !privateKey) {
    console.warn(
      "[push] faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY; no se envía nada"
    );
    configured = false;
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Delivers one payload to many devices.
 *
 * Every failure is swallowed on purpose: these calls hang off Server Actions
 * that have already committed their write, so a push provider being down must
 * never turn a successful "crear partido" into an error. 404/410 mean the
 * browser threw the subscription away, so we drop our copy too — otherwise
 * dead endpoints pile up forever.
 */
export async function sendPushToSubscriptions(
  subscriptions: StoredSubscription[],
  payload: PushPayload
): Promise<void> {
  if (subscriptions.length === 0) return;
  if (!ensureConfigured()) return;

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body
      )
    )
  );

  const gone: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") return;

    const statusCode = (result.reason as { statusCode?: number } | undefined)?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      gone.push(subscriptions[index].endpoint);
    } else {
      console.warn("[push] falló el envío", statusCode ?? result.reason);
    }
  });

  if (gone.length > 0) {
    const admin = createAdminClient();
    if (admin) await admin.from("push_subscriptions").delete().in("endpoint", gone);
  }
}

/**
 * Subscriptions belonging to the given users.
 *
 * Prefers the service-role client, because notifying someone means reading a
 * `push_subscriptions` row that isn't ours and RLS normally scopes that table
 * to its owner. Falls back to the caller's own client when the service-role
 * key isn't configured: if the table's SELECT policy turns out to be permissive
 * this still delivers, and if it isn't we're no worse off than returning empty.
 */
export async function getSubscriptionsForUsers(
  supabase: Client,
  userIds: string[]
): Promise<StoredSubscription[]> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return [];

  const admin = createAdminClient();

  if (!admin) {
    console.warn(
      "[push] falta SUPABASE_SERVICE_ROLE_KEY; intentando leer las suscripciones con la sesión del usuario (la RLS puede devolver vacío)"
    );
  }

  const { data, error } = await (admin ?? supabase)
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", ids);

  if (error) {
    console.warn("[push] no se pudieron leer las suscripciones", error.message);
    return [];
  }

  if ((data ?? []).length === 0) {
    console.warn(
      `[push] ningún dispositivo para ${ids.length} usuario(s); ` +
        (admin ? "no tienen suscripciones" : "puede ser la RLS bloqueando la lectura")
    );
  }

  return data ?? [];
}

/** Sends one notification to every device of the given users. */
export async function notifyUsers(
  supabase: Client,
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  await sendPushToSubscriptions(await getSubscriptionsForUsers(supabase, userIds), payload);
}

/**
 * Sends a push (as `notifyUsers` does) and, alongside it, saves the same
 * event to the in-app notification feed (`lib/notifications/create.ts`).
 * The pair is meant for every user-directed event — the push is the
 * real-time nudge, the saved row is what a user who missed it (or never
 * granted push permission) still gets to see in `/notificaciones`.
 */
export async function notifyAndPersist(
  supabase: Client,
  userIds: string[],
  payload: PushPayload,
  type: NotificationType,
  actorId?: string
): Promise<void> {
  await Promise.all([
    notifyUsers(supabase, userIds, payload),
    persistNotifications(userIds, {
      type,
      title: payload.title,
      body: payload.body,
      url: payload.url,
      actorId,
    }),
  ]);
}

/**
 * Broadcasts a match to everyone whose `notification_scopes` opt them into
 * hearing about it. Audience membership per scope (own network, friends of
 * friends, same courts) already lives in the `resolve_audience_subscriptions`
 * SQL function; here we just union the scopes and dedupe, since one person can
 * qualify under more than one and should still get a single notification.
 *
 * Takes the caller's client rather than the admin one: the RPC is scoped to
 * the match, and the organizer triggering the broadcast is the caller.
 */
export async function notifyMatchAudience(
  supabase: Client,
  matchId: string,
  payload: PushPayload
): Promise<void> {
  const byEndpoint = new Map<string, StoredSubscription>();

  for (const scope of AUDIENCE_SCOPES) {
    const { data, error } = await supabase.rpc("resolve_audience_subscriptions", {
      p_match_id: matchId,
      p_scope: scope,
    });

    if (error) {
      console.warn(`[push] no se pudo resolver la audiencia "${scope}"`, error.message);
      continue;
    }

    for (const row of data ?? []) {
      byEndpoint.set(row.endpoint, {
        endpoint: row.endpoint,
        p256dh: row.p256dh,
        auth: row.auth,
      });
    }
  }

  // The organizer can fall inside their own match's audience; being told
  // about the match you just created is pure noise. RLS scopes this read to
  // the caller's own rows, which is exactly the set to drop.
  const { data: ownSubscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint");

  for (const row of ownSubscriptions ?? []) byEndpoint.delete(row.endpoint);

  await sendPushToSubscriptions([...byEndpoint.values()], payload);
}
