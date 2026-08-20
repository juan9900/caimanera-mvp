"use client";

import { useActionState } from "react";
import { updateCourt } from "@/app/actions/courts";
import { CourtSponsorshipFields } from "@/components/courts/court-form-fields";
import type { Court } from "@/lib/auth/dal";

export function EditCourtForm({ court }: { court: Court }) {
  const [state, action, pending] = useActionState(updateCourt.bind(null, court.id), undefined);

  return (
    <form action={action} className="w-full space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          defaultValue={court.name}
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
            defaultValue={court.lat}
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
            defaultValue={court.lng}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
          />
          {state?.errors?.lng && (
            <p className="mt-1 text-sm text-red-600">{state.errors.lng[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-zinc-700">
          Dirección (opcional)
        </label>
        <input
          id="address"
          name="address"
          defaultValue={court.address ?? ""}
          placeholder="Ej: Av. 15 Las Delicias, Maracaibo"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {state?.errors?.address && (
          <p className="mt-1 text-sm text-red-600">{state.errors.address[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="schedule" className="block text-sm font-medium text-zinc-700">
          Horario (opcional)
        </label>
        <input
          id="schedule"
          name="schedule"
          defaultValue={court.schedule ?? ""}
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
          defaultValue={court.contact_phone ?? ""}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
      </div>

      <CourtSponsorshipFields
        defaultValues={{
          logoUrl: court.logo_url,
          photos: court.photos,
          whatsappUrl: court.whatsapp_url,
          bookingUrl: court.booking_url,
          amenities: court.amenities,
          sports: court.sports,
          isOfficial: court.is_official,
          sponsoredUntil: court.sponsored_until,
          sponsorPriority: court.sponsor_priority,
          promoText: court.promo_text,
          promoCode: court.promo_code,
          promoExpiresAt: court.promo_expires_at,
        }}
        errors={state?.errors}
      />

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
