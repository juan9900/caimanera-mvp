"use client";

import { useActionState } from "react";
import { createMatch } from "@/app/actions/matches";
import type { Court } from "@/lib/auth/dal";

export function CreateMatchForm({ courts }: { courts: Court[] }) {
  const [state, action, pending] = useActionState(createMatch, undefined);

  return (
    <form action={action} className="w-full space-y-5">
      <div>
        <label htmlFor="courtId" className="block text-sm font-medium text-zinc-700">
          Cancha
        </label>
        <select
          id="courtId"
          name="courtId"
          defaultValue=""
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        >
          <option value="" disabled>
            Elige una cancha
          </option>
          {courts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.name}
            </option>
          ))}
        </select>
        {state?.errors?.courtId && (
          <p className="mt-1 text-sm text-red-600">{state.errors.courtId[0]}</p>
        )}
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700">Deporte</legend>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-zinc-700">
            <input type="radio" name="sport" value="futbol" defaultChecked />
            Fútbol
          </label>
          <label className="flex items-center gap-2 text-zinc-700">
            <input type="radio" name="sport" value="tenis" />
            Tenis
          </label>
        </div>
        {state?.errors?.sport && (
          <p className="mt-1 text-sm text-red-600">{state.errors.sport[0]}</p>
        )}
      </fieldset>

      <div>
        <label htmlFor="datetime" className="block text-sm font-medium text-zinc-700">
          Fecha y hora
        </label>
        <input
          id="datetime"
          name="datetime"
          type="datetime-local"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {state?.errors?.datetime && (
          <p className="mt-1 text-sm text-red-600">{state.errors.datetime[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="totalSlots" className="block text-sm font-medium text-zinc-700">
          Cupos totales
        </label>
        <input
          id="totalSlots"
          name="totalSlots"
          type="number"
          min={2}
          max={30}
          defaultValue={10}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {state?.errors?.totalSlots && (
          <p className="mt-1 text-sm text-red-600">{state.errors.totalSlots[0]}</p>
        )}
      </div>

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

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "Creando..." : "Armar partido"}
      </button>
    </form>
  );
}
