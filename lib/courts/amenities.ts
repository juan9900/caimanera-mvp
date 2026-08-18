import {
  SquareParking,
  Utensils,
  Beer,
  Sofa,
  Toilet,
  ShowerHead,
  Wifi,
  Lightbulb,
  Snowflake,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Canonical list of court amenities. Shared by the admin court form, the court
 * detail page, and the create-match court picker so the keys/labels/icons stay
 * in sync in one place. `courts.amenities` stores an array of these `key`s.
 */
export const AMENITIES = [
  { key: "estacionamiento", label: "Estacionamiento", Icon: SquareParking },
  { key: "comida", label: "Comida", Icon: Utensils },
  { key: "bebida", label: "Bebida", Icon: Beer },
  { key: "sala_espera", label: "Sala de espera", Icon: Sofa },
  { key: "banos", label: "Baños", Icon: Toilet },
  { key: "vestuario", label: "Vestuario", Icon: ShowerHead },
  { key: "wifi", label: "Wi-Fi", Icon: Wifi },
  { key: "iluminacion", label: "Iluminación", Icon: Lightbulb },
  { key: "aire", label: "Aire/Techada", Icon: Snowflake },
  { key: "seguridad", label: "Seguridad", Icon: ShieldCheck },
] as const satisfies ReadonlyArray<{ key: string; label: string; Icon: LucideIcon }>;

export type AmenityKey = (typeof AMENITIES)[number]["key"];

export const AMENITY_KEYS: readonly AmenityKey[] = AMENITIES.map((a) => a.key);

const AMENITY_BY_KEY = new Map(AMENITIES.map((a) => [a.key, a]));

/** Looks up an amenity's label/icon by key; returns undefined for unknown/stale keys. */
export function getAmenity(key: string) {
  return AMENITY_BY_KEY.get(key as AmenityKey);
}
