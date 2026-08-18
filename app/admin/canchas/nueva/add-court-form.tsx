"use client";

import { useActionState } from "react";
import { createCourt } from "@/app/actions/courts";
import { CourtSponsorshipFields } from "@/components/courts/court-form-fields";

export function AddCourtForm() {
  const [state, action, pending] = useActionState(createCourt, undefined);

  return (
    <form action={action} className="w-full space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          placeholder="Ej: Cancha Los Haticos"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="lat" className="block text-sm font-medium text-zinc-700">
            Latitud
          </label>
          <input
            id="lat"
            name="lat"
            type="number"
            step="any"
            placeholder="10.6316"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
          />
          {state?.errors?.lat && (
            <p className="mt-1 text-sm text-red-600">{state.errors.lat[0]}</p>
          )}
        </div>

        <div className="flex-1">
          <label htmlFor="lng" className="block text-sm font-medium text-zinc-700">
            Longitud
          </label>
          <input
            id="lng"
            name="lng"
            type="number"
            step="any"
            placeholder="-71.6444"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
          />
          {state?.errors?.lng && (
            <p className="mt-1 text-sm text-red-600">{state.errors.lng[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="schedule" className="block text-sm font-medium text-zinc-700">
          Horario (opcional)
        </label>
        <input
          id="schedule"
          name="schedule"
          placeholder="Ej: Lun-Dom 6am-10pm"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="contactPhone" className="block text-sm font-medium text-zinc-700">
          Teléfono de contacto (opcional)
        </label>
        <input
          id="contactPhone"
          name="contactPhone"
          placeholder="Ej: 0414-1234567"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
      </div>

      <CourtSponsorshipFields errors={state?.errors} />

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Agregar cancha"}
      </button>
    </form>
  );
}
