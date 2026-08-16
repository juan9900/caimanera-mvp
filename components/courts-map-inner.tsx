"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Link from "next/link";

const courtIcon = L.icon({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type CourtMarker = { id: string; name: string; lat: number; lng: number };

export function CourtsMapInner({ courts }: { courts: CourtMarker[] }) {
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
        <Marker key={court.id} position={[court.lat, court.lng]} icon={courtIcon}>
          <Popup>
            <Link href={`/canchas/${court.id}`}>{court.name}</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
