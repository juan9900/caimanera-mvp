"use client";

import { useState, useTransition } from "react";
import { updateNotificationScopes } from "@/app/actions/profile";
import { EnableNotifications } from "@/components/enable-notifications";

const NOTIFICATION_OPTIONS = [
  { value: "red", label: "Personas de mi red" },
  { value: "amigos", label: "Fuera de mi red, con amigos en común" },
  { value: "canchas", label: "Extraños que juegan donde yo juego" },
] as const;

export function NotificationPreferences({
  initialScopes,
}: {
  initialScopes: string[];
}) {
  const [scopes, setScopes] = useState<string[]>(initialScopes);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const noNotifications = scopes.length === 0;

  function persist(next: string[]) {
    setScopes(next);
    setMessage(null);
    startTransition(async () => {
      const result = await updateNotificationScopes(next);
      setMessage(result.message ?? "Preferencias guardadas.");
    });
  }

  function toggleScope(value: string) {
    persist(
      scopes.includes(value) ? scopes.filter((v) => v !== value) : [...scopes, value]
    );
  }

  return (
    <div className="rounded-xl border border-surface-variant/50 bg-surface-container p-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm font-medium text-on-surface">Notificaciones en este dispositivo</p>
        <EnableNotifications
          onEnabled={() => {
            if (scopes.length === 0) {
              persist(NOTIFICATION_OPTIONS.map((opt) => opt.value));
            }
          }}
        />
      </div>

      <fieldset className="mt-4">
        <legend className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          ¿Quiénes te pueden avisar?
        </legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 font-body text-on-surface">
            <input
              type="checkbox"
              checked={noNotifications}
              disabled={isPending}
              onChange={() => persist([])}
              className="accent-primary-lime"
            />
            No quiero recibir notificaciones
          </label>
          <div className="ml-1 space-y-1 border-l border-surface-variant pl-3">
            {NOTIFICATION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 font-body text-on-surface">
                <input
                  type="checkbox"
                  checked={scopes.includes(opt.value)}
                  disabled={isPending}
                  onChange={() => toggleScope(opt.value)}
                  className="accent-primary-lime"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {message && <p className="mt-3 font-body text-xs text-on-surface-variant">{message}</p>}
    </div>
  );
}
