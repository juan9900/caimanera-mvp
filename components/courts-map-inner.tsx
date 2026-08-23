"use client";

import { MapContainer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DarkTiles, buildCourtIcon, CourtPopupContent } from "@/components/map/map-shared";

export type CourtMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sports?: string[] | null;
  is_official?: boolean;
};

export function CourtsMapInner({
  courts,
  preferredSports,
}: {
  courts: CourtMarker[];
  preferredSports?: string[];
}) {
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
        <Marker
          key={court.id}
          position={[court.lat, court.lng]}
          icon={buildCourtIcon(court.sports, { official: court.is_official, preferredSports })}
        >
          <Popup autoPan={false}>
            <CourtPopupContent
              name={court.name}
              sports={court.sports}
              href={`/canchas/${court.id}`}
              official={court.is_official}
            />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
