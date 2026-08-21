"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import type { LatLngBounds, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { DarkTiles, buildCourtIcon, CourtPopupContent } from "@/components/map/map-shared";
import type { Court } from "@/lib/auth/dal";

export type MapViewBounds = { south: number; west: number; north: number; east: number };
export type MapFocusTarget = { id: string; lat: number; lng: number };

function toViewBounds(bounds: LatLngBounds): MapViewBounds {
  return {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  };
}

/** Pans (without changing zoom) to a court and opens its pin's popup — drives "show on map" from the drawer list. */
function FocusCourt({
  target,
  markerRefs,
}: {
  target: MapFocusTarget | null;
  markerRefs: React.RefObject<Map<string, LeafletMarker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.panTo([target.lat, target.lng], { animate: true });
    markerRefs.current.get(target.id)?.openPopup();
  }, [map, target, markerRefs]);

  return null;
}

/** Reports the map's visible area on mount and after every pan/zoom, so the court list can track "what's on screen" instead of a fixed radius. */
function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (bounds: MapViewBounds) => void }) {
  const map = useMap();

  useEffect(() => {
    onBoundsChange(toViewBounds(map.getBounds()));
    // Only on mount — `moveend` below covers every subsequent change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMoveEnd = useCallback(() => {
    onBoundsChange(toViewBounds(map.getBounds()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, onBoundsChange]);

  const mapEventHandlers = useMemo(() => ({ moveend: handleMoveEnd }), [handleMoveEnd]);
  useMapEvents(mapEventHandlers);

  return null;
}

export function MapAreaInner({
  courts,
  center,
  selectedId,
  focusTarget,
  onSelect,
  onBoundsChange,
  preferredSports,
}: {
  courts: Court[];
  center: [number, number];
  selectedId: string | null;
  focusTarget?: MapFocusTarget | null;
  onSelect: (id: string) => void;
  onBoundsChange?: (bounds: MapViewBounds) => void;
  preferredSports?: string[];
}) {
  const markerRefs = useRef(new Map<string, LeafletMarker>());

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full" zoomControl={false}>
      <DarkTiles />
      {onBoundsChange && <BoundsWatcher onBoundsChange={onBoundsChange} />}
      {focusTarget && <FocusCourt target={focusTarget} markerRefs={markerRefs} />}
      {courts.map((court) => (
        <Marker
          key={court.id}
          ref={(marker) => {
            if (marker) markerRefs.current.set(court.id, marker);
            else markerRefs.current.delete(court.id);
          }}
          position={[court.lat, court.lng]}
          icon={buildCourtIcon(court.sports, {
            selected: court.id === selectedId,
            official: court.is_official,
            preferredSports,
          })}
          eventHandlers={{ click: () => onSelect(court.id) }}
        >
          <Popup>
            <CourtPopupContent
              name={court.name}
              address={court.address}
              sports={court.sports}
              href={`/canchas/${court.id}`}
              ratingAvg={court.rating_avg}
              ratingCount={court.rating_count}
              official={court.is_official}
            />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
