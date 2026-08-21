"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { searchVenezuelaCities, type VenezuelaCity } from "@/lib/geo/venezuela-cities";
import type { LocationCandidate } from "@/app/actions/location";

/**
 * Search input + GPS button + results list for picking a Venezuelan city —
 * the reusable "guts" of `LocationSelector` (the header/`/mapa` dropdown),
 * factored out so onboarding and `/perfil` can embed the same picker inline
 * (always visible, no dropdown chrome) instead of duplicating the search
 * logic. Purely controlled: calls `onSelect` with the picked candidate and
 * leaves persistence to the caller.
 */
export function CityPicker({
  onSelect,
  autoFocus,
}: {
  onSelect: (candidate: LocationCandidate) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchVenezuelaCities(query), [query]);

  function pickCity(city: VenezuelaCity) {
    setQuery("");
    onSelect({ label: `${city.name}, ${city.state}`, lat: city.lat, lng: city.lng });
  }

  function useGps() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((result) => {
      onSelect({
        label: "Mi ubicación actual",
        lat: result.coords.latitude,
        lng: result.coords.longitude,
      });
    });
  }

  return (
    <div>
      <input
        autoFocus={autoFocus}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Escribe tu ciudad..."
        className="w-full rounded-lg border border-surface-variant bg-surface px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary-lime focus:outline-none"
      />

      <button
        type="button"
        onClick={useGps}
        className="mt-2 flex items-center gap-1.5 font-label text-xs font-bold uppercase tracking-wide text-primary-lime"
      >
        <MapPin aria-hidden size={14} />
        Usar mi ubicación GPS
      </button>

      {query.trim() && results.length === 0 && (
        <p className="mt-2 font-body text-xs text-on-surface-variant">No encontramos esa ciudad.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
          {results.map((city) => (
            <li key={`${city.lat},${city.lng}`}>
              <button
                type="button"
                onClick={() => pickCity(city)}
                className="w-full truncate rounded-lg px-2 py-1.5 text-left font-body text-sm text-on-surface hover:bg-surface-variant/50"
              >
                {city.name}
                <span className="text-on-surface-variant">, {city.state}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
