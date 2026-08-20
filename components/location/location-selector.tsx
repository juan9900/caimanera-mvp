"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, MapPin } from "lucide-react";
import { setUserLocation } from "@/app/actions/location";
import { searchVenezuelaCities, type VenezuelaCity } from "@/lib/geo/venezuela-cities";

/**
 * App-wide location picker shown in the header (`components/site-header.tsx`)
 * and on `/mapa` (`components/mapa/map-experience.tsx`). Lets the user type a
 * Venezuelan city and pick it from `VENEZUELA_CITIES` (instant local search —
 * Nominatim free-text geocoding didn't reliably surface smaller towns like
 * "Lechería"). Picking a result saves it to `users.location_*`
 * (`setUserLocation`) and refreshes the page so every map/distance on the
 * app recenters around it.
 */
export function LocationSelector({ authed, initialLabel }: { authed: boolean; initialLabel: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchVenezuelaCities(query), [query]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function pick(candidate: { label: string; lat: number; lng: number }) {
    setOpen(false);
    setQuery("");
    startTransition(async () => {
      await setUserLocation(candidate);
      router.refresh();
    });
  }

  function pickCity(city: VenezuelaCity) {
    pick({ label: `${city.name}, ${city.state}`, lat: city.lat, lng: city.lng });
  }

  function useGps() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((result) => {
      pick({
        label: "Mi ubicación actual",
        lat: result.coords.latitude,
        lng: result.coords.longitude,
      });
    });
  }

  if (!authed) {
    return (
      <span className="flex flex-col leading-tight">
        <span className="font-label text-[11px] font-medium uppercase tracking-wider text-primary-lime">
          Ubicación
        </span>
        <span className="font-display text-base font-bold">Cerca de ti</span>
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-start leading-tight"
      >
        <span className="font-label text-[11px] font-medium uppercase tracking-wider text-primary-lime">
          Ubicación
        </span>
        <span className="flex items-center gap-1 font-display text-base font-bold text-on-surface">
          <span className="max-w-40 truncate">{initialLabel ?? "Cerca de ti"}</span>
          {pending ? (
            <Loader2 aria-hidden size={16} className="animate-spin text-primary-lime" />
          ) : (
            <ChevronDown aria-hidden size={16} className="text-primary-lime" />
          )}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-outline-variant/50 bg-surface-container p-3 shadow-xl">
          <input
            autoFocus
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
      )}
    </div>
  );
}
