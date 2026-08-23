"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ServiceWorkerRegistration() {
  const router = useRouter();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal; the app works without offline support.
      });
    }
  }, []);

  // Deep-linking: the SW can't navigate windows it doesn't control (notably
  // iOS PWAs), so `notificationclick` postMessages the target URL here and we
  // navigate with the app's own router instead.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === "navigate" && typeof data.url === "string") {
        router.push(data.url);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [router]);

  return null;
}
