"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "@/app/actions/profile";
import { subscribeToPush } from "@/lib/push/subscribe-client";

const NOTIFICATION_OPTIONS = [
  { value: "red", label: "Personas de mi red" },
  { value: "amigos", label: "Fuera de mi red, con amigos en común" },
  { value: "canchas", label: "Extraños que juegan donde yo juego" },
] as const;

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);
  const [notificationScopes, setNotificationScopes] = useState<string[]>([]);
  const [subscribing, setSubscribing] = useState(false);

  const noNotifications = notificationScopes.length === 0;

  function toggleScope(value: string) {
    setNotificationScopes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(formData: FormData) {
    if (notificationScopes.length > 0) {
      setSubscribing(true);
      await subscribeToPush();
      setSubscribing(false);
    }
    action(formData);
  }

  return (
    <form action={handleSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="zone" className="block text-sm font-medium text-zinc-700">
          Zona en Maracaibo
        </label>
        <input
          id="zone"
          name="zone"
          placeholder="Ej: La Lago"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {state?.errors?.zone && (
          <p className="mt-1 text-sm text-red-600">{state.errors.zone[0]}</p>
        )}
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700">Deportes</legend>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-zinc-700">
            <input type="checkbox" name="sportPreferences" value="futbol" />
            Fútbol
          </label>
          <label className="flex items-center gap-2 text-zinc-700">
            <input type="checkbox" name="sportPreferences" value="tenis" />
            Tenis
          </label>
        </div>
        {state?.errors?.sportPreferences && (
          <p className="mt-1 text-sm text-red-600">{state.errors.sportPreferences[0]}</p>
        )}
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700">Vibra</legend>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-zinc-700">
            <input type="radio" name="vibe" value="relajado" defaultChecked />
            Relajado
          </label>
          <label className="flex items-center gap-2 text-zinc-700">
            <input type="radio" name="vibe" value="competitivo" />
            Competitivo
          </label>
        </div>
        {state?.errors?.vibe && (
          <p className="mt-1 text-sm text-red-600">{state.errors.vibe[0]}</p>
        )}
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700">Notificaciones</legend>
        <div className="mt-1 space-y-2">
          <label className="flex items-center gap-2 text-zinc-700">
            <input
              type="checkbox"
              checked={noNotifications}
              onChange={() => setNotificationScopes([])}
            />
            No quiero recibir notificaciones
          </label>
          <div className="ml-1 space-y-1 border-l border-zinc-200 pl-3">
            {NOTIFICATION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-zinc-700">
                <input
                  type="checkbox"
                  name="notificationScopes"
                  value={opt.value}
                  checked={notificationScopes.includes(opt.value)}
                  onChange={() => toggleScope(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        {state?.errors?.notificationScopes && (
          <p className="mt-1 text-sm text-red-600">{state.errors.notificationScopes[0]}</p>
        )}
      </fieldset>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        disabled={pending || subscribing}
        type="submit"
        className="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {pending || subscribing ? "Guardando..." : "Guardar y continuar"}
      </button>
    </form>
  );
}
