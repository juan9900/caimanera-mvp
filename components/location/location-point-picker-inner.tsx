"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { DarkTiles, buildCourtIcon } from "@/components/map/map-shared";

// Same default center used elsewhere in the app (`/mapa`'s fallback,
// `add-court-form` placeholders) when there's no user location yet.
const DEFAULT_CENTER: [number, number] = [10.6316, -71.6444];

// "You are here" dot — a pulsing halo (animate-ping) behind a solid core, in
// the same lime used for badges/CTAs elsewhere. Non-interactive: it's just a
// locator, the suggestion pin is what `onChange` reports.
const USER_LOCATION_ICON = L.divIcon({
  className: "",
  html: `<span class="relative flex h-4 w-4">
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-lime opacity-75"></span>
    <span class="relative inline-flex h-4 w-4 rounded-full bg-primary-lime ring-2 ring-white/80"></span>
  </span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// `MapContainer`'s `center`/`zoom` props only apply once, at mount — they're
// ignored on re-render (see react-leaflet's `MapContainer`). Geolocation
// resolves asynchronously after the map has already mounted on
// `DEFAULT_CENTER`, so we need to imperatively re-pan once it arrives.
function RecenterOnChange({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 15);
  }, [map, center]);
  return null;
}

/**
 * "Tap to place a pin" map used by the "sugerir lugar" flow — unlike every
 * other map in the app (which shows existing courts), this one starts empty
 * and lets any signed-in user drop/drag a single marker to say "the place is
 * here". Reuses `buildCourtIcon`'s generic fallback pin (no sports) so the
 * marker matches the app's visual language instead of Leaflet's default.
 */
export function LocationPointPickerInner({
  center,
  value,
  onChange,
}: {
  center?: [number, number];
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const icon = useMemo(() => buildCourtIcon(null, { selected: true }), []);
  const mapCenter = center ?? (value ? [value.lat, value.lng] : DEFAULT_CENTER);

  return (
    <MapContainer
      center={mapCenter}
      zoom={value ? 15 : 12}
      scrollWheelZoom={false}
      className="h-64 w-full rounded-xl"
    >
      <DarkTiles />
      {!value && <RecenterOnChange center={center} />}
      <ClickToPlace onPick={onChange} />
      {center && (
        <Marker
          position={center}
          icon={USER_LOCATION_ICON}
          interactive={false}
          keyboard={false}
          zIndexOffset={-1000}
        />
      )}
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              onChange(pos.lat, pos.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
