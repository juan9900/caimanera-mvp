"use client";

import { useEffect, useState } from "react";
import {
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/subscribe-client";

type Status = "unsupported" | "checking" | "denied" | "enabled" | "disabled";

/** Lets the current user opt in/out of Web Push notifications for this device. */
export function EnableNotifications({ onEnabled }: { onEnabled?: () => void } = {}) {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getPushSubscriptionStatus().then((result) => {
      if (!cancelled) setStatus(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setPending(true);
    try {
      const result = await subscribeToPush();
      setStatus(result === "enabled" || result === "denied" ? result : "disabled");
      if (result === "enabled") onEnabled?.();
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    try {
      await unsubscribeFromPush();
      setStatus("disabled");
    } finally {
      setPending(false);
    }
  }

  if (status === "unsupported" || status === "checking") return null;

  if (status === "denied") {
    return (
      <p className="text-xs text-zinc-500">
        Bloqueaste las notificaciones para este sitio. Actívalas desde los ajustes del navegador.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={status === "enabled" ? disable : enable}
      disabled={pending}
      className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
    >
      {status === "enabled" ? "Desactivar notificaciones" : "Activar notificaciones"}
    </button>
  );
}
