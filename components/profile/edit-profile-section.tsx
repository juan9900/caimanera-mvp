"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions/profile";
import { SPORTS } from "@/lib/courts/sports";
import { SportChip } from "@/components/courts/sport-chip";
import { CityPicker } from "@/components/location/city-picker";
import type { LocationCandidate } from "@/app/actions/location";

const VIBE_OPTIONS = [
  { value: "relajado", label: "Relajado" },
  { value: "competitivo", label: "Competitivo" },
] as const;

/**
 * Editable section of `/perfil`: ciudad, vibe and favorite sports —
 * everything set at onboarding except `name`, which stays read-only in the
 * header above. "Ciudad" writes to the same `location_*` columns used
 * app-wide for map centering/distance (`updateProfile` → same columns as
 * `setUserLocation`), so it's the single source of truth: changing it here
 * updates the map everywhere, and changing it from the header/`/mapa`
 * picker updates what shows here too. Mirrors `NotificationPreferences`'s
 * local-state + `useTransition` + server action pattern, and reuses
 * `SportChip` (same multi-select glyphs as onboarding and the `/mapa`
 * filter row) so the sport picker looks identical everywhere.
 */
export function EditProfileSection({
  initialLocation,
  initialVibe,
  initialSports,
}: {
  initialLocation: LocationCandidate | null;
  initialVibe: string;
  initialSports: string[];
}) {
  const [location, setLocation] = useState<LocationCandidate | null>(initialLocation);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [vibe, setVibe] = useState(initialVibe);
  const [sportPreferences, setSportPreferences] = useState<string[]>(initialSports);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function toggleSport(key: string) {
    setSportPreferences((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function save() {
    if (!location) return;
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfile({ location, vibe, sportPreferences });
      setMessage(result.message ?? "Perfil actualizado.");
    });
  }

  return (
    <section className="rounded-2xl border border-surface-variant/50 bg-surface-container p-5">
      <p className="font-display text-base font-bold text-on-surface">Tu perfil</p>

      <div className="mt-4">
        <span className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Ciudad
        </span>
        {pickingLocation ? (
          <div className="mt-1 rounded-lg border border-surface-variant bg-surface p-3">
            <CityPicker
              autoFocus
              onSelect={(candidate) => {
                setLocation(candidate);
                setPickingLocation(false);
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickingLocation(true)}
            className="mt-1 flex w-full items-center justify-between rounded-lg border border-surface-variant bg-surface px-3 py-2 font-body text-on-surface"
          >
            {location?.label ?? "Elige tu ciudad"}
            <span className="font-label text-xs text-primary-lime">Cambiar</span>
          </button>
        )}
      </div>

      <fieldset className="mt-4">
        <legend className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Vibra
        </legend>
        <div className="mt-2 flex gap-4">
          {VIBE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 font-body text-on-surface">
              <input
                type="radio"
                name="vibe"
                value={opt.value}
                checked={vibe === opt.value}
                onChange={() => setVibe(opt.value)}
                className="accent-primary-lime"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
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
      </fieldset>

      <button
        type="button"
        onClick={save}
        disabled={isPending || sportPreferences.length === 0 || !location}
        className="mt-5 w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar"}
      </button>

      {message && <p className="mt-3 font-body text-xs text-on-surface-variant">{message}</p>}
    </section>
  );
}
