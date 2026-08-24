"use client";

import { useState, useTransition } from "react";
import { ChevronDown, MapPinPlus } from "lucide-react";
import { createPendingCourt } from "@/app/actions/courts";
import { LocationPointPicker } from "@/components/location/location-point-picker";
import type { AddPendingCourtFormState } from "@/lib/courts/definitions";
import type { Court } from "@/lib/auth/dal";

type PendingCourt = Pick<Court, "id" | "name" | "lat" | "lng" | "sports">;

/**
 * Collapsed-by-default "add a place" section embedded directly in a map
 * screen (exploration map, match court picker) — no page navigation. Any
 * signed-in user can drop a pin + name to create a court immediately
 * (`verified: false`); it's usable right away by its creator (e.g. picked
 * for a match) but hidden from everyone else until an admin verifies it in
 * `/admin/sugerencias`. Trigger copy is deliberately "¿No aparece tu
 * lugar?" instead of anything map-related, so it doesn't read as "confirm
 * this point" like the picker below it.
 *
 * Calls the server action directly (via `useTransition`) instead of
 * `useActionState` + `<form>`: it needs to react to a successful result by
 * closing itself and handing the new court to the caller in one step, with
 * no separate "success" screen to flash through — and the match forms embed
 * this inside their own `<form>`, where a nested `<form>` element is invalid
 * HTML (the browser drops the inner one, so its submit button would submit
 * the outer match form instead).
 */
export function AddPlaceInline({
  initialName,
  open: openProp,
  onOpenChange,
  onCreated,
}: {
  initialName?: string;
  /** Controlled open state — e.g. the exploration map's "sin resultados" CTA
   * opens this from outside. Uncontrolled (internal state) when omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (court: PendingCourt) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AddPendingCourtFormState>();
  const [name, setName] = useState(initialName ?? "");
  const [reference, setReference] = useState("");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [center, setCenter] = useState<[number, number] | undefined>(undefined);

  function handleOpen() {
    setResult(undefined);
    setOpen(true);
    // Try to center the map on the user's current location so they don't
    // have to pan far to find the place they're adding.
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((geo) => {
        setCenter([geo.coords.latitude, geo.coords.longitude]);
      });
    }
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("lat", point ? String(point.lat) : "");
    formData.set("lng", point ? String(point.lng) : "");
    formData.set("reference", reference);

    startTransition(async () => {
      const nextResult = await createPendingCourt(undefined, formData);
      if (nextResult?.success && nextResult.court) {
        // No intermediate "success" screen: as soon as the place exists,
        // hand it to the caller and collapse back to the trigger.
        onCreated?.(nextResult.court);
        setOpen(false);
        setName("");
        setReference("");
        setPoint(null);
        return;
      }
      setResult(nextResult);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-surface-variant bg-surface-container/60 px-3 py-2.5 font-label text-xs font-bold uppercase tracking-wide text-primary-lime"
      >
        <MapPinPlus aria-hidden size={16} />
        ¿No aparece tu lugar?
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-surface-variant bg-surface-container/60 p-3">
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="flex w-full items-center justify-between gap-2 font-label text-xs font-bold uppercase tracking-wide text-on-surface"
      >
        <span className="flex items-center gap-2 text-primary-lime">
          <MapPinPlus aria-hidden size={16} />
          Agregar un lugar nuevo
        </span>
        <ChevronDown aria-hidden size={16} className="rotate-180" />
      </button>

      <div className="flex w-full flex-col gap-3">
        <div>
          <label htmlFor="name" className="mb-1 block font-body text-sm text-on-surface-variant">
            Nombre del lugar
          </label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Cancha de la plaza Bolívar"
            className="w-full rounded-lg border border-surface-variant bg-surface px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary-lime focus:outline-none"
          />
          {result?.errors?.name && (
            <p className="mt-1 font-body text-xs text-dark-error">{result.errors.name[0]}</p>
          )}
        </div>

        <div>
          <p className="mb-1 font-body text-sm text-on-surface-variant">
            Toca el mapa para marcar dónde está
          </p>
          <LocationPointPicker center={center} value={point} onChange={(lat, lng) => setPoint({ lat, lng })} />
          {(result?.errors?.lat || result?.errors?.lng) && (
            <p className="mt-1 font-body text-xs text-dark-error">
              {result?.errors?.lat?.[0] ?? result?.errors?.lng?.[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reference" className="mb-1 block font-body text-sm text-on-surface-variant">
            Referencia (opcional)
          </label>
          <textarea
            id="reference"
            name="reference"
            rows={2}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ej: cancha techada, entrada por la calle 5"
            className="w-full rounded-lg border border-surface-variant bg-surface px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary-lime focus:outline-none"
          />
        </div>

        {result?.message && !result.success && (
          <p className="font-body text-sm text-dark-error">{result.message}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || !point}
          className="inline-flex items-center justify-center rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Agregando..." : "Agregar lugar"}
        </button>
      </div>
    </div>
  );
}
