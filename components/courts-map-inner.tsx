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
  is_public?: boolean;
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
          icon={buildCourtIcon(court.sports, {
            official: court.is_official,
            public: court.is_public,
            preferredSports,
          })}
        >
          <Popup autoPan={false}>
            <CourtPopupContent
              name={court.name}
              sports={court.sports}
              href={`/canchas/${court.id}`}
              official={court.is_official}
              isPublic={court.is_public}
            />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
