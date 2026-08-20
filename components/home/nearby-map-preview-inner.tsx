"use client";

import { MapContainer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DarkTiles, buildCourtIcon } from "@/components/map/map-shared";
import type { HomeCourt } from "@/lib/matches/home";

/** Static (non-interactive) preview map for the home "Cerca de ti" card — full interaction lives on `/mapa`. */
export function NearbyMapPreviewInner({
  courts,
  center,
}: {
  courts: HomeCourt[];
  center: [number, number];
}) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-full w-full"
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
    >
      <DarkTiles />
      {courts.map((court) => (
        <Marker key={court.id} position={[court.lat, court.lng]} icon={buildCourtIcon(court.sports)} />
      ))}
    </MapContainer>
  );
}
