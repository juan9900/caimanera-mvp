"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LocateFixed, MapPinPlus, Search } from "lucide-react";
import { SPORTS, getSport } from "@/lib/courts/sports";
import { sortCourtsForCreateMatchPicker } from "@/lib/courts/sort";
import { haversineKm, formatDistance } from "@/lib/geo/distance";
import type { Court, UserLocation } from "@/lib/auth/dal";
import { setUserLocation } from "@/app/actions/location";
import { LocationSelector } from "@/components/location/location-selector";
import { SportChip } from "@/components/courts/sport-chip";
import { AddPlaceInline } from "@/components/courts/suggest-court-form";
import { MapArea } from "@/components/mapa/map-area";
import type { MapFocusTarget, MapViewBounds } from "@/components/mapa/map-area-inner";
import { CourtDrawer } from "@/components/mapa/court-drawer";

/** A court matches free-text search by its own name or by any sport it offers (e.g. "futbol" or "fútbol"). */
function matchesSearch(court: Court, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (court.name.toLowerCase().includes(q)) return true;
  return (court.sports ?? []).some((key) => getSport(key)?.label.toLowerCase().includes(q));
}

const NEARBY_RADIUS_KM = 15;

/**
 * Full-screen map experience opened from the home "Cerca de ti" card
 * (`components/home/nearby-map-card.tsx`). Chips filter by sport, the map
 * (`MapArea`, dynamic — Leaflet needs `window`) and the `CourtDrawer` below
 * it share selection state so tapping a pin highlights its card and vice
 * versa. The location selector here is the same `LocationSelector` used in
 * the header — `/mapa` is a `fixed inset-0` overlay outside the normal
 * layout, so the header (and its selector) isn't visible on this screen.
 */
export function MapExperience({
  courts,
  userLocation,
  preferredSports,
}: {
  courts: Court[];
  userLocation: UserLocation | null;
  preferredSports?: string[];
}) {
  const router = useRouter();
  const [sport, setSport] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [addPlaceInitialName, setAddPlaceInitialName] = useState<string | undefined>(undefined);
  const [locating, startLocating] = useTransition();
  // Keyed by `centerKey` (below) so a remounted map (new `center`) doesn't
  // briefly filter against the previous view's now-stale bounds.
  const [viewBounds, setViewBounds] = useState<{ key: string; bounds: MapViewBounds } | null>(null);
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!suggestionsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [suggestionsOpen]);

  const mappable = useMemo(
    () => courts.filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)),
    [courts],
  );

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    return mappable.filter((court) => matchesSearch(court, search)).slice(0, 5);
  }, [mappable, search]);

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : mappable.length > 0
      ? [mappable[0].lat, mappable[0].lng]
      : [10.6316, -71.6444];
  const centerKey = `${center[0]},${center[1]}`;

  // All courts matching the sport/search chips, regardless of where the map
  // is panned — these are the pins plotted on the map itself.
  const sportSearchFiltered = useMemo(() => {
    const matched = mappable.filter((court) => {
      if (sport && !court.sports?.includes(sport)) return false;
      return matchesSearch(court, search);
    });
    return sortCourtsForCreateMatchPicker(matched);
  }, [mappable, sport, search]);

  // The drawer ("N lugares cerca") tracks the map's current visible area —
  // it re-filters on every pan/zoom instead of a fixed radius around the
  // saved location, so panning to another city surfaces its courts too.
  // Before the map reports its first view, fall back to the saved-location
  // radius so the drawer isn't empty on first paint.
  const currentViewBounds = viewBounds?.key === centerKey ? viewBounds.bounds : null;

  // Stable identity across renders — react-leaflet's `useMapEvents` re-subscribes
  // whenever its handlers object changes, so an inline arrow function here caused
  // it to tear down/re-add the `moveend` listener on every render.
  const handleBoundsChange = useCallback((bounds: MapViewBounds) => {
    setViewBounds((prev) => {
      if (
        prev?.key === centerKey &&
        prev.bounds.south === bounds.south &&
        prev.bounds.west === bounds.west &&
        prev.bounds.north === bounds.north &&
        prev.bounds.east === bounds.east
      ) {
        return prev;
      }
      return { key: centerKey, bounds };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerKey]);

  const filtered = useMemo(() => {
    if (currentViewBounds) {
      return sportSearchFiltered.filter(
        (court) =>
          court.lat >= currentViewBounds.south &&
          court.lat <= currentViewBounds.north &&
          court.lng >= currentViewBounds.west &&
          court.lng <= currentViewBounds.east,
      );
    }
    if (!userLocation) return sportSearchFiltered;
    return sportSearchFiltered.filter(
      (court) => haversineKm(userLocation, court) <= NEARBY_RADIUS_KM,
    );
  }, [sportSearchFiltered, currentViewBounds, userLocation]);

  const distanceByCourtId = useMemo(() => {
    if (!userLocation) return undefined;
    const map = new Map<string, string>();
    for (const court of mappable) {
      map.set(court.id, formatDistance(haversineKm(userLocation, court)));
    }
    return map;
  }, [userLocation, mappable]);

  function showOnMap(court: Court) {
    setSelectedId(court.id);
    setFocusTarget({ id: court.id, lat: court.lat, lng: court.lng });
    setDrawerOpen(false);
  }

  function pickSuggestion(court: Court) {
    setSearch(court.name);
    setSuggestionsOpen(false);
    setSelectedId(court.id);
    setDrawerOpen(true);
  }

  function locateMe() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((result) => {
      startLocating(async () => {
        await setUserLocation({
          label: "Mi ubicación actual",
          lat: result.coords.latitude,
          lng: result.coords.longitude,
        });
        router.refresh();
      });
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface">
      <div className="flex items-center gap-2 border-b border-outline-variant/50 px-4 py-3">
        <Link
          href="/"
          aria-label="Volver"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface"
        >
          <ArrowLeft aria-hidden size={18} />
        </Link>
        <div ref={searchRef} className="relative flex-1">
          <Search
            aria-hidden
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder="Buscar cancha o deporte..."
            className="w-full rounded-full border border-surface-variant bg-surface-container py-2 pl-9 pr-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary-lime focus:outline-none"
          />

          {suggestionsOpen && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col gap-1 rounded-xl border border-outline-variant/50 bg-surface-container p-2 shadow-xl">
              {suggestions.map((court) => (
                <li key={court.id}>
                  <button
                    type="button"
                    onClick={() => pickSuggestion(court)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left font-body text-sm text-on-surface hover:bg-surface-variant/50"
                  >
                    <span className="truncate">{court.name}</span>
                    {court.is_official && (
                      <span className="shrink-0 rounded-full bg-secondary-container/90 px-2 py-0.5 font-label text-[10px] font-bold text-on-secondary-container">
                        Oficial
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {suggestionsOpen && search.trim() && suggestions.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-outline-variant/50 bg-surface-container p-3 shadow-xl">
              <p className="font-body text-sm text-on-surface-variant">
                No encontramos &quot;{search.trim()}&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuggestionsOpen(false);
                  setAddPlaceInitialName(search.trim());
                  setAddPlaceOpen(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 font-label text-xs font-bold uppercase tracking-wide text-primary-lime"
              >
                <MapPinPlus aria-hidden size={14} />
                Agregar este lugar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        <LocationSelector authed initialLabel={userLocation?.label ?? null} />

        <div className="no-scrollbar mt-3 flex w-full gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSport(null)}
            aria-pressed={sport === null}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-label text-xs font-bold uppercase tracking-wide transition-colors ${
              sport === null
                ? "border-primary-lime bg-primary-lime text-on-primary"
                : "border-surface-variant bg-surface-container text-on-surface hover:border-primary-lime/50"
            }`}
          >
            Todos
          </button>
          {SPORTS.map(({ key }) => (
            <SportChip
              key={key}
              sportKey={key}
              active={sport === key}
              onClick={() => setSport(sport === key ? null : key)}
            />
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {/* `isolate` contains Leaflet's internal z-index (its attribution/zoom
            controls go up to 1000) inside this layer, so it can't paint above
            the locate button/drawer below despite them coming later in the DOM. */}
        <div className="absolute inset-0 isolate">
          <MapArea
            key={centerKey}
            courts={sportSearchFiltered}
            center={center}
            selectedId={selectedId}
            focusTarget={focusTarget}
            onBoundsChange={handleBoundsChange}
            onSelect={setSelectedId}
            preferredSports={preferredSports}
          />
        </div>

        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          aria-label="Usar mi ubicación"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary-lime shadow-md disabled:opacity-60"
        >
          <LocateFixed aria-hidden size={18} className={locating ? "animate-pulse" : undefined} />
        </button>

        <button
          type="button"
          onClick={() => setAddPlaceOpen((v) => !v)}
          aria-label="¿No aparece tu lugar? Agrégalo"
          title="¿No aparece tu lugar? Agrégalo"
          aria-expanded={addPlaceOpen}
          className="absolute right-3 top-16 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary-lime shadow-md"
        >
          <MapPinPlus aria-hidden size={18} />
        </button>

        {addPlaceOpen && (
          <div className="absolute inset-x-3 top-3 z-40 max-h-[calc(100%-2rem)] overflow-y-auto">
            <AddPlaceInline
              open
              initialName={addPlaceInitialName}
              onOpenChange={(v) => setAddPlaceOpen(v)}
              onCreated={() => {
                setAddPlaceOpen(false);
                router.refresh();
              }}
            />
          </div>
        )}

        <CourtDrawer
          courts={filtered}
          open={drawerOpen}
          onToggle={() => setDrawerOpen((v) => !v)}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onShowOnMap={showOnMap}
          distanceByCourtId={distanceByCourtId}
        />
      </div>
    </div>
  );
}
