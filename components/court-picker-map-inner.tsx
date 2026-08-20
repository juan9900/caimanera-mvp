"use client";

import { MapContainer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DarkTiles, buildCourtIcon, CourtPopupContent } from "@/components/map/map-shared";

export type CourtPickerMarker = { id: string; name: string; lat: number; lng: number; sports?: string[] | null };

export function CourtPickerMapInner({
  courts,
  selectedId,
  onSelect,
}: {
  courts: CourtPickerMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
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
          icon={buildCourtIcon(court.sports, { selected: court.id === selectedId })}
          eventHandlers={{ click: () => onSelect(court.id) }}
        >
          <Popup>
            <CourtPopupContent name={court.name} sports={court.sports} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
