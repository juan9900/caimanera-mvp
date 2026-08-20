"use client";

import { useState, useTransition } from "react";
import { Bell, Check } from "lucide-react";
import { updateNotificationScopes } from "@/app/actions/profile";
import {
  getPushDiagnostics,
  sendTestNotification,
  type PushDiagnostics,
} from "@/app/actions/push";
import { EnableNotifications } from "@/components/enable-notifications";

/** One line of the push diagnostics panel. */
function DiagnosticRow({
  label,
  ok,
  hint,
}: {
  label: string;
  ok: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span>
        {label}
        {!ok && hint && (
          <span className="mt-0.5 block text-on-surface-variant/70">{hint}</span>
        )}
      </span>
      <span className={ok ? "text-primary-lime" : "text-dark-error"}>
        {ok ? "OK" : "Falta"}
      </span>
    </div>
  );
}

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
  const [diagnostics, setDiagnostics] = useState<PushDiagnostics | null>(null);

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

  function runDiagnostics() {
    setMessage(null);
    startTransition(async () => {
      setDiagnostics(await getPushDiagnostics());
    });
  }

  function toggleScope(value: string) {
    persist(
      scopes.includes(value) ? scopes.filter((v) => v !== value) : [...scopes, value]
    );
  }

  return (
    <section className="rounded-2xl border border-surface-variant/50 bg-surface-container p-5">
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
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={testNotification}
            disabled={isPending}
            className="font-body text-xs text-primary-lime underline underline-offset-4 disabled:opacity-50"
          >
            Enviar notificación de prueba
          </button>
          <button
            type="button"
            onClick={runDiagnostics}
            disabled={isPending}
            className="font-body text-xs text-on-surface-variant underline underline-offset-4 disabled:opacity-50"
          >
            Ver diagnóstico
          </button>
        </div>
      )}

      {diagnostics && (
        <dl className="mt-3 flex flex-col gap-1 rounded-xl border border-surface-variant/50 bg-surface px-4 py-3 font-body text-xs text-on-surface-variant">
          <DiagnosticRow label="Claves VAPID" ok={diagnostics.vapidConfigured} />
          <DiagnosticRow
            label="Clave service_role"
            ok={diagnostics.serviceRoleConfigured}
            hint="Sin ella no se puede avisar a otros usuarios (invitaciones, solicitudes)."
          />
          <DiagnosticRow
            label="Este dispositivo suscrito"
            ok={diagnostics.ownSubscriptions > 0}
          />
          <DiagnosticRow
            label="Alcance a otros usuarios"
            ok={diagnostics.serviceRoleConfigured || diagnostics.canReachOtherUsers}
            hint="Si falla, la RLS de push_subscriptions bloquea la lectura y hace falta la clave service_role."
          />
        </dl>
      )}

      {message && <p className="mt-3 font-body text-xs text-on-surface-variant">{message}</p>}
    </section>
  );
}
