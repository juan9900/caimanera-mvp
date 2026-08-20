/**
 * Pure, framework-agnostic logic for the home screen: filtering, sorting and
 * picking which courts to feature. Kept separate from the DAL (which is
 * server-only) so it can be imported from client components and unit-tested
 * directly, and separate from data-fetching so "how we rank/filter" stays in
 * one easy-to-change place (see home-ui-spec.md).
 */
import type { Tables } from "@/lib/supabase/database.types";
import { haversineKm, type LatLng } from "@/lib/geo/distance";
import { SPORTS } from "@/lib/courts/sports";

export const SPORT_LABELS: Record<string, string> = Object.fromEntries(
  SPORTS.map(({ key, label }) => [key, label]),
);

export const VIBE_LABELS: Record<string, string> = {
  relajado: "Relajado",
  competitivo: "Competitivo",
};

export type HomeCourt = Pick<
  Tables<"courts">,
  | "id"
  | "name"
  | "lat"
  | "lng"
  | "address"
  | "sports"
  | "is_official"
  | "photos"
  | "logo_url"
  | "amenities"
  | "promo_text"
  | "promo_code"
  | "promo_expires_at"
  | "sponsored_until"
  | "sponsor_priority"
>;

export type HomeMatch = Tables<"matches"> & {
  court: HomeCourt | null;
  organizer: { name: string | null } | null;
};

export type FeaturedCourt = {
  court: HomeCourt;
  openMatchCount: number;
};

/**
 * Which courts to show in the featured banners/row, and in what order.
 * Today: every official court, unranked. Isolated here so a future paid
 * rotation only needs to change this function.
 */
export function selectFeaturedCourts(
  officialCourts: HomeCourt[],
  openMatches: HomeMatch[],
): FeaturedCourt[] {
  const countByCourtId = new Map<string, number>();
  for (const match of openMatches) {
    if (!match.court_id) continue;
    countByCourtId.set(
      match.court_id,
      (countByCourtId.get(match.court_id) ?? 0) + 1,
    );
  }

  return officialCourts.map((court) => ({
    court,
    openMatchCount: countByCourtId.get(court.id) ?? 0,
  }));
}

/** Default max distance (km) from the user's location for "nearby" content. */
export const DEFAULT_RADIUS_KM = 15;

/** Steps offered to widen the search when nothing falls within the current radius. */
export const RADIUS_EXPANSION_STEPS_KM = [15, 30, 50, 100];

function withinRadius(
  point: { lat: number; lng: number },
  position: LatLng,
  radiusKm: number,
): boolean {
  return haversineKm(position, point) <= radiusKm;
}

/** Keeps only the courts within `radiusKm` of `position`. */
export function filterCourtsByRadius<T extends { lat: number; lng: number }>(
  courts: T[],
  position: LatLng,
  radiusKm: number,
): T[] {
  return courts.filter((court) => withinRadius(court, position, radiusKm));
}

/** Keeps only the matches (with a court) within `radiusKm` of `position`. */
export function filterMatchesByRadius(
  matches: HomeMatch[],
  position: LatLng,
  radiusKm: number,
): HomeMatch[] {
  return matches.filter(
    (match) => match.court != null && withinRadius(match.court, position, radiusKm),
  );
}

/**
 * Smallest radius from `steps` (ascending) that contains at least one item,
 * or `null` if none do, even at the widest step. Used to auto-widen content
 * that has no manual "ampliar rango" control (e.g. the map preview card).
 */
export function smallestRadiusWithResults<T extends { lat: number; lng: number }>(
  items: T[],
  position: LatLng,
  steps: number[] = RADIUS_EXPANSION_STEPS_KM,
): number | null {
  for (const radiusKm of steps) {
    if (items.some((item) => withinRadius(item, position, radiusKm))) return radiusKm;
  }
  return null;
}

/** Slots still needed to fill a match. */
export function slotsNeeded(
  match: Pick<HomeMatch, "total_slots" | "slots_filled">,
): number {
  return Math.max(0, match.total_slots - match.slots_filled);
}

/**
 * Orders matches by urgency: fewest open slots first, then soonest first.
 */
export function sortByUrgency(matches: HomeMatch[]): HomeMatch[] {
  return [...matches].sort((a, b) => {
    const bySlots = slotsNeeded(a) - slotsNeeded(b);
    if (bySlots !== 0) return bySlots;
    return a.datetime.localeCompare(b.datetime);
  });
}

export type HomeFilters = {
  sports: string[];
  today: boolean;
  search: string;
};

export const EMPTY_FILTERS: HomeFilters = {
  sports: [],
  today: false,
  search: "",
};

function isToday(isoDatetime: string): boolean {
  const date = new Date(isoDatetime);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Filters matches in-place for the "Sesiones públicas" list: sport chips, "hoy" chip, and free-text search by court name. */
export function filterMatches(
  matches: HomeMatch[],
  filters: HomeFilters,
): HomeMatch[] {
  const search = filters.search.trim().toLowerCase();

  return matches.filter((match) => {
    if (filters.sports.length > 0 && !filters.sports.includes(match.sport)) {
      return false;
    }
    if (filters.today && !isToday(match.datetime)) {
      return false;
    }
    if (search && !(match.court?.name ?? "").toLowerCase().includes(search)) {
      return false;
    }
    return true;
  });
}
