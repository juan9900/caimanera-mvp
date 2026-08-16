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
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700">Notificaciones en este dispositivo</p>
        <EnableNotifications
          onEnabled={() => {
            if (scopes.length === 0) {
              persist(NOTIFICATION_OPTIONS.map((opt) => opt.value));
            }
          }}
        />
      </div>

      <fieldset className="mt-4">
        <legend className="block text-sm font-medium text-zinc-700">
          ¿Quiénes te pueden avisar?
        </legend>
        <div className="mt-1 space-y-2">
          <label className="flex items-center gap-2 text-zinc-700">
            <input
              type="checkbox"
              checked={noNotifications}
              disabled={isPending}
              onChange={() => persist([])}
            />
            No quiero recibir notificaciones
          </label>
          <div className="ml-1 space-y-1 border-l border-zinc-200 pl-3">
            {NOTIFICATION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-zinc-700">
                <input
                  type="checkbox"
                  checked={scopes.includes(opt.value)}
                  disabled={isPending}
                  onChange={() => toggleScope(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {message && <p className="mt-3 text-xs text-zinc-500">{message}</p>}
    </div>
  );
}
