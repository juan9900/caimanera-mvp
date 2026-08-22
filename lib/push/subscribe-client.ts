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
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

/** True when running as an installed PWA (standalone display mode). */
export function isStandalone(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari exposes this non-standard flag on navigator.
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

/**
 * iOS Safari only supports Web Push when the site has been added to the
 * home screen (installed as a standalone PWA). In a regular Safari tab,
 * `PushManager` doesn't exist, so `isPushSupported()` is false there.
 */
export function needsIosInstall(): boolean {
  if (typeof navigator === "undefined") return false;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return isIos && !isPushSupported() && !isStandalone();
}

export type SubscribeResult =
  | "enabled"
  | "denied"
  /** The deployment is missing `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. */
  | "misconfigured"
  | "unsupported"
  | "error";

/**
 * Requests notification permission (if needed) and subscribes the current
 * device to Web Push, persisting the subscription server-side.
 *
 * Must be called synchronously from a user gesture (a click handler): iOS
 * only shows the native permission prompt while the page still holds user
 * activation, and awaiting anything first throws that away. For the same
 * reason `Notification.requestPermission()` is the very first thing we do —
 * a missing VAPID key is reported *after* the prompt, so a misconfigured
 * deployment can still be told apart from a denied permission.
 */
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!isPushSupported()) return "unsupported";

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return permission === "denied" ? "denied" : "error";
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return "misconfigured";

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const result = await savePushSubscription(subscription.toJSON());
    if (result.message) {
      // The browser now holds a subscription the server doesn't know about;
      // drop it so a retry starts clean instead of looking already-enabled.
      await subscription.unsubscribe();
      return "error";
    }

    return "enabled";
  } catch (error) {
    console.warn("[push] no se pudo suscribir", error);
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
  } catch (error) {
    // Best-effort.
    console.warn("[push] no se pudo desuscribir", error);
  }
}

/** Checks whether the current device already has an active push subscription. */
export async function getPushSubscriptionStatus(): Promise<
  "unsupported" | "ios-install" | "denied" | "enabled" | "disabled"
> {
  if (!isPushSupported()) return needsIosInstall() ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";

  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    return sub ? "enabled" : "disabled";
  } catch {
    return "disabled";
  }
}
