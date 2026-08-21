"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { setUserLocation, type LocationCandidate } from "@/app/actions/location";
import { CityPicker } from "@/components/location/city-picker";

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
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

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

  function pick(candidate: LocationCandidate) {
    setOpen(false);
    startTransition(async () => {
      await setUserLocation(candidate);
      router.refresh();
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
          <CityPicker onSelect={pick} autoFocus />
        </div>
      )}
    </div>
  );
}
