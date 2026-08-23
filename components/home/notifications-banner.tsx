"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getPushSubscriptionStatus } from "@/lib/push/subscribe-client";

/**
 * Persistent nudge under the featured courts carousel for users who haven't
 * enabled push notifications on this device yet. Only covers states where
 * tapping through to Perfil actually helps — `ios-install` and `unsupported`
 * get their own guidance elsewhere (AddToHomeScreenGuide / EnableNotifications).
 */
export function NotificationsBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPushSubscriptionStatus().then((status) => {
      if (!cancelled) setShow(status === "disabled" || status === "denied");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="px-4">
      <Link
        href="/perfil#notificaciones"
        className="flex items-center gap-3 rounded-xl border border-primary-lime/40 bg-primary-lime/10 px-4 py-3 active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-lime/20 text-primary-lime">
          <Bell size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-body text-sm font-bold text-on-surface">
            No tienes las notificaciones activadas
          </span>
          <span className="block font-body text-xs text-on-surface-variant">
            Toca aquí para activarlas y no perderte partidos
          </span>
        </span>
      </Link>
    </div>
  );
}
