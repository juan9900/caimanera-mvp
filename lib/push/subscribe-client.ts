"use client";

import { savePushSubscription, deletePushSubscription } from "@/app/actions/push";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/** Whether the browser can support Web Push at all. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export type SubscribeResult = "enabled" | "denied" | "unsupported" | "error";

/**
 * Requests notification permission (if needed) and subscribes the current
 * device to Web Push, persisting the subscription server-side.
 */
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!isPushSupported()) return "unsupported";

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return "error";

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return permission === "denied" ? "denied" : "error";
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await savePushSubscription(subscription.toJSON());
    return "enabled";
  } catch {
    return "error";
  }
}

/** Unsubscribes the current device from Web Push and removes it server-side. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await deletePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
    }
  } catch {
    // Best-effort.
  }
}

/** Checks whether the current device already has an active push subscription. */
export async function getPushSubscriptionStatus(): Promise<
  "unsupported" | "denied" | "enabled" | "disabled"
> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    return sub ? "enabled" : "disabled";
  } catch {
    return "disabled";
  }
}
