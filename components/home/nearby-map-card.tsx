import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NearbyMapPreview } from "@/components/home/nearby-map-preview";
import {
  filterCourtsByRadius,
  smallestRadiusWithResults,
  type HomeCourt,
} from "@/lib/matches/home";
import type { UserLocation } from "@/lib/auth/dal";

/**
 * Home-screen "Cerca de ti" card: a static preview map of the user's area
 * (or the first court, if they haven't set a location) with a court count
 * badge and an "Abrir mapa" button that leads to the full-screen `/mapa`
 * experience (`components/mapa/map-experience.tsx`).
 */
export function NearbyMapCard({
  courts,
  userLocation,
}: {
  courts: HomeCourt[];
  userLocation: UserLocation | null;
}) {
  const finite = courts.filter(
    (c) => Number.isFinite(c.lat) && Number.isFinite(c.lng),
  );
  if (finite.length === 0) return null;

  // With a saved location, only show courts within the nearest non-empty
  // radius step so the count/badge reflects "near you" instead of every
  // court in the country. If nothing is close even at the widest step, show
  // the card truthfully empty (0 lugares) rather than falling back to every
  // court in the app — that's what caused the badge to lie about distance.
  const mappable = userLocation
    ? (() => {
        const radius = smallestRadiusWithResults(finite, userLocation);
        return radius == null ? [] : filterCourtsByRadius(finite, userLocation, radius);
      })()
    : finite;

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [finite[0].lat, finite[0].lng];

  return (
    <section className="flex flex-col gap-3 px-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-on-surface">Cerca de ti</h2>
        {userLocation && (
          <span className="font-label text-xs font-bold uppercase tracking-wide text-primary-lime">
            {userLocation.label.split(",")[0]}
          </span>
        )}
      </div>

      <Link
        href="/mapa"
        className="relative block h-56 w-full overflow-hidden rounded-2xl border border-surface-variant/50 bg-surface-container transition-transform active:scale-[0.98]"
      >
        {/* `isolate` contains Leaflet's internal z-index (its attribution/zoom
            controls go up to 1000) inside this layer, so it can't paint above
            the badge/button below despite them coming later in the DOM. */}
        <div className="pointer-events-none absolute inset-0 isolate">
          {/* react-leaflet's `center` only applies on mount, not on prop
              updates — keying by the coordinates forces a clean remount
              (already-centered) whenever the user's location changes. */}
          <NearbyMapPreview key={`${center[0]},${center[1]}`} courts={mappable} center={center} />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/70 via-transparent to-transparent" />

        <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 font-label text-xs font-bold text-on-surface backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-lime" aria-hidden />
          {mappable.length} {mappable.length === 1 ? "lugar" : "lugares"}
        </span>

        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-primary-lime px-4 py-2 font-label text-xs font-bold uppercase tracking-wide text-on-primary shadow-md">
          Abrir mapa
          <ArrowRight aria-hidden size={14} />
        </span>
      </Link>
    </section>
  );
}
