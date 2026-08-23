"use client";

import { useState, useTransition } from "react";
import { Bell, Check } from "lucide-react";
import { updateNotificationScopes } from "@/app/actions/profile";
import { sendTestNotification } from "@/app/actions/push";
import { EnableNotifications } from "@/components/enable-notifications";

const NOTIFICATION_OPTIONS = [
  { value: "red", label: "Personas de mi red" },
  { value: "amigos", label: "Fuera de mi red, con amigos en común" },
  { value: "canchas", label: "Cualquier persona" },
] as const;

export function NotificationPreferences({
  initialScopes,
}: {
  initialScopes: string[];
}) {
  const [scopes, setScopes] = useState<string[]>(initialScopes);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);

  function persist(next: string[]) {
    setScopes(next);
    setMessage(null);
    startTransition(async () => {
      const result = await updateNotificationScopes(next);
      setMessage(result.message ?? "Preferencias guardadas.");
    });
  }

  function testNotification() {
    setMessage(null);
    startTransition(async () => {
      const result = await sendTestNotification();
      setMessage(result.message);
    });
  }

  function toggleScope(value: string) {
    persist(
      scopes.includes(value) ? scopes.filter((v) => v !== value) : [...scopes, value]
    );
  }

  return (
    <section
      id="notificaciones"
      className="rounded-2xl border border-surface-variant/50 bg-surface-container p-5 scroll-mt-20"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lime/10 text-primary-lime">
            <Bell size={18} />
          </span>
          <div>
            <p className="font-display text-base font-bold text-on-surface">Notificaciones</p>
            <p className="font-body text-xs text-on-surface-variant">En este dispositivo</p>
          </div>
        </div>
        <EnableNotifications
          onEnabled={() => {
            if (scopes.length === 0) {
              persist(NOTIFICATION_OPTIONS.map((opt) => opt.value));
            }
          }}
          onStatusChange={setPushEnabled}
          onMessage={setMessage}
        />
      </div>

      <fieldset className="mt-5" disabled={!pushEnabled || isPending}>
        <legend className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          ¿Quiénes te pueden avisar?
        </legend>
        <div className={`mt-2 flex flex-col gap-2 ${!pushEnabled ? "opacity-40" : ""}`}>
          {NOTIFICATION_OPTIONS.map((opt) => {
            const checked = scopes.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 font-body transition-colors ${
                  pushEnabled ? "cursor-pointer" : "cursor-not-allowed"
                } ${
                  checked
                    ? "border-primary-lime/50 bg-primary-lime/10 text-on-surface"
                    : "border-surface-variant text-on-surface-variant"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!pushEnabled || isPending}
                  onChange={() => toggleScope(opt.value)}
                  className="sr-only"
                />
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    checked
                      ? "border-primary-lime bg-primary-lime text-on-primary"
                      : "border-surface-variant"
                  }`}
                >
                  {checked && <Check size={14} strokeWidth={3} />}
                </span>
                {opt.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {pushEnabled && (
        <button
          type="button"
          onClick={testNotification}
          disabled={isPending}
          className="mt-4 font-body text-xs text-primary-lime underline underline-offset-4 disabled:opacity-50"
        >
          Enviar notificación de prueba
        </button>
      )}

      {message && <p className="mt-3 font-body text-xs text-on-surface-variant">{message}</p>}
    </section>
  );
}
