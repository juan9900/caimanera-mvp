/**
 * Pure, framework-agnostic logic for the home screen: filtering, sorting and
 * picking which courts to feature. Kept separate from the DAL (which is
 * server-only) so it can be imported from client components and unit-tested
 * directly, and separate from data-fetching so "how we rank/filter" stays in
 * one easy-to-change place (see home-ui-spec.md).
 */
import type { Tables } from "@/lib/supabase/database.types";

export const SPORT_LABELS: Record<string, string> = {
  futbol: "Fútbol",
};

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
    countByCourtId.set(match.court_id, (countByCourtId.get(match.court_id) ?? 0) + 1);
  }

  return officialCourts.map((court) => ({
    court,
    openMatchCount: countByCourtId.get(court.id) ?? 0,
  }));
}

/** Slots still needed to fill a match. */
export function slotsNeeded(match: Pick<HomeMatch, "total_slots" | "slots_filled">): number {
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

export const EMPTY_FILTERS: HomeFilters = { sports: [], today: false, search: "" };

function isToday(isoDatetime: string): boolean {
  const date = new Date(isoDatetime);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Filters matches in-place for the "Te necesitan ya" list: sport chips, "hoy" chip, and free-text search by court name. */
export function filterMatches(matches: HomeMatch[], filters: HomeFilters): HomeMatch[] {
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
