"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "@/app/actions/profile";

const NOTIFICATION_OPTIONS = [
  { value: "red", label: "Personas de mi red" },
  { value: "amigos", label: "Fuera de mi red, con amigos en común" },
  { value: "canchas", label: "Extraños que juegan donde yo juego" },
] as const;

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);
  const [notificationScopes, setNotificationScopes] = useState<string[]>([]);

  const noNotifications = notificationScopes.length === 0;

  function toggleScope(value: string) {
    setNotificationScopes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  return (
    <form action={action} className="w-full max-w-sm space-y-5">
      <div>
        <label htmlFor="name" className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          className="mt-1 w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface focus:border-primary-lime focus:outline-none"
        />
        {state?.errors?.name && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="zone" className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Zona en Maracaibo
        </label>
        <input
          id="zone"
          name="zone"
          placeholder="Ej: La Lago"
          className="mt-1 w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-lime focus:outline-none"
        />
        {state?.errors?.zone && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.zone[0]}</p>
        )}
      </div>

      <input type="hidden" name="sportPreferences" value="futbol" />
      {state?.errors?.sportPreferences && (
        <p className="mt-1 font-body text-sm text-dark-error">{state.errors.sportPreferences[0]}</p>
      )}

      <fieldset>
        <legend className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Vibra
        </legend>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 font-body text-on-surface">
            <input type="radio" name="vibe" value="relajado" defaultChecked className="accent-primary-lime" />
            Relajado
          </label>
          <label className="flex items-center gap-2 font-body text-on-surface">
            <input type="radio" name="vibe" value="competitivo" className="accent-primary-lime" />
            Competitivo
          </label>
        </div>
        {state?.errors?.vibe && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.vibe[0]}</p>
        )}
      </fieldset>

      <fieldset>
        <legend className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Notificaciones
        </legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 font-body text-on-surface">
            <input
              type="checkbox"
              checked={noNotifications}
              onChange={() => setNotificationScopes([])}
              className="accent-primary-lime"
            />
            No quiero recibir notificaciones
          </label>
          <div className="ml-1 space-y-1 border-l border-surface-variant pl-3">
            {NOTIFICATION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 font-body text-on-surface">
                <input
                  type="checkbox"
                  name="notificationScopes"
                  value={opt.value}
                  checked={notificationScopes.includes(opt.value)}
                  onChange={() => toggleScope(opt.value)}
                  className="accent-primary-lime"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        {state?.errors?.notificationScopes && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.notificationScopes[0]}</p>
        )}
        {!noNotifications && (
          <p className="mt-2 font-body text-xs text-on-surface-variant">
            Falta un paso: el permiso del teléfono se pide desde Ajustes, con el
            interruptor de notificaciones.
          </p>
        )}
      </fieldset>

      {state?.message && <p className="font-body text-sm text-dark-error">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)] disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
