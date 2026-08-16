"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Served from /public so the URL is a plain string, independent of how the
// bundler handles image imports from inside node_modules.
const courtIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedCourtIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [33, 54],
  iconAnchor: [16, 54],
  popupAnchor: [1, -44],
  shadowSize: [54, 54],
  className: "hue-rotate-90",
});

export type CourtPickerMarker = { id: string; name: string; lat: number; lng: number };

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
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {courts.map((court) => (
        <Marker
          key={court.id}
          position={[court.lat, court.lng]}
          icon={court.id === selectedId ? selectedCourtIcon : courtIcon}
          eventHandlers={{ click: () => onSelect(court.id) }}
        >
          <Popup>{court.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
