"use client";

import { MapContainer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DarkTiles, buildCourtIcon, CourtPopupContent } from "@/components/map/map-shared";

export type CourtMarker = { id: string; name: string; lat: number; lng: number; sports?: string[] | null };

export function CourtsMapInner({ courts }: { courts: CourtMarker[] }) {
  const center: [number, number] = [courts[0].lat, courts[0].lng];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      className="h-80 w-full rounded-md"
    >
      <DarkTiles />
      {courts.map((court) => (
        <Marker key={court.id} position={[court.lat, court.lng]} icon={buildCourtIcon(court.sports)}>
          <Popup>
            <CourtPopupContent name={court.name} sports={court.sports} href={`/canchas/${court.id}`} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
