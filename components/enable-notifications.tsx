"use client";

import { useEffect, useState } from "react";
import {
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/subscribe-client";

type Status = "unsupported" | "ios-install" | "checking" | "denied" | "enabled" | "disabled";

/** Lets the current user opt in/out of Web Push notifications for this device. */
export function EnableNotifications({
  onEnabled,
  onStatusChange,
}: {
  onEnabled?: () => void;
  onStatusChange?: (enabled: boolean) => void;
} = {}) {
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

  useEffect(() => {
    onStatusChange?.(status === "enabled");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

  if (status === "ios-install") {
    return (
      <p className="font-body text-xs text-on-surface-variant">
        Para recibir notificaciones en iPhone: tocá{" "}
        <span aria-hidden="true">Compartir ⬆️</span> en Safari y elegí{" "}
        <strong>&quot;Añadir a pantalla de inicio&quot;</strong>. Después abrí Caimanera
        desde ese ícono y activá las notificaciones ahí.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="font-body text-xs text-on-surface-variant">
        Bloqueaste las notificaciones para este sitio. Actívalas desde los ajustes del navegador.
      </p>
    );
  }

  const enabled = status === "enabled";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Desactivar notificaciones" : "Activar notificaciones"}
      onClick={enabled ? disable : enable}
      disabled={pending}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        enabled ? "bg-primary-lime" : "bg-surface-variant"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-on-surface shadow-sm transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
