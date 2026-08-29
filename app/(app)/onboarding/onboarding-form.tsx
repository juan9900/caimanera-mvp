"use client";

import { useActionState, useState, useTransition } from "react";
import { completeOnboarding } from "@/app/actions/profile";
import { sendTestNotification } from "@/app/actions/push";
import { SPORTS } from "@/lib/courts/sports";
import { SportChip } from "@/components/courts/sport-chip";
import { CityPicker } from "@/components/location/city-picker";
import { EnableNotifications } from "@/components/enable-notifications";
import type { LocationCandidate } from "@/app/actions/location";

const NOTIFICATION_OPTIONS = [
  { value: "red", label: "Personas de mi red" },
  { value: "amigos", label: "Fuera de mi red, con amigos en común" },
  { value: "canchas", label: "Extraños que juegan donde yo juego" },
] as const;

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);
  const [notificationScopes, setNotificationScopes] = useState<string[]>([]);
  const [sportPreferences, setSportPreferences] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationCandidate | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [testPending, startTestTransition] = useTransition();

  function testNotification() {
    setPushMessage(null);
    startTestTransition(async () => {
      const result = await sendTestNotification();
      setPushMessage(result.message);
    });
  }

  function toggleScope(value: string) {
    setNotificationScopes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleSport(key: string) {
    setSportPreferences((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
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
        <span className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Ciudad
        </span>
        {location ? (
          <button
            type="button"
            onClick={() => setLocation(null)}
            className="mt-1 flex w-full items-center justify-between rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface"
          >
            {location.label}
            <span className="font-label text-xs text-primary-lime">Cambiar</span>
          </button>
        ) : (
          <div className="mt-1 rounded-lg border border-surface-variant bg-surface-container p-3">
            <CityPicker onSelect={setLocation} />
          </div>
        )}
        <input type="hidden" name="locationLabel" value={location?.label ?? ""} />
        <input type="hidden" name="locationLat" value={location?.lat ?? ""} />
        <input type="hidden" name="locationLng" value={location?.lng ?? ""} />
        {(state?.errors?.locationLabel || state?.errors?.locationLat || state?.errors?.locationLng) && (
          <p className="mt-1 font-body text-sm text-dark-error">
            {state.errors.locationLabel?.[0] ?? state.errors.locationLat?.[0] ?? state.errors.locationLng?.[0]}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Deportes favoritos
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPORTS.map(({ key }) => (
            <SportChip
              key={key}
              sportKey={key}
              active={sportPreferences.includes(key)}
              onClick={() => toggleSport(key)}
            />
          ))}
        </div>
        {sportPreferences.map((key) => (
          <input key={key} type="hidden" name="sportPreferences" value={key} />
        ))}
        {state?.errors?.sportPreferences && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.sportPreferences[0]}</p>
        )}
      </fieldset>

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
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-surface-variant bg-surface-container px-3 py-2.5">
          <span className="font-body text-sm text-on-surface">Activar notificaciones</span>
          <EnableNotifications
            onEnabled={() => {
              if (notificationScopes.length === 0) {
                setNotificationScopes(NOTIFICATION_OPTIONS.map((opt) => opt.value));
              }
            }}
            onStatusChange={setPushEnabled}
            onMessage={setPushMessage}
          />
        </div>

        {pushEnabled && (
          <div className="mt-3 space-y-1 border-l border-surface-variant pl-3">
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
        )}
        {state?.errors?.notificationScopes && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.notificationScopes[0]}</p>
        )}

        {pushEnabled && (
          <button
            type="button"
            onClick={testNotification}
            disabled={testPending}
            className="mt-3 font-body text-xs text-primary-lime underline underline-offset-4 disabled:opacity-50"
          >
            Enviar notificación de prueba
          </button>
        )}
        {pushMessage && <p className="mt-2 font-body text-xs text-on-surface-variant">{pushMessage}</p>}
      </fieldset>

      {state?.message && <p className="font-body text-sm text-dark-error">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
