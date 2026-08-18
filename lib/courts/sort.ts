import type { Tables } from "@/lib/supabase/database.types";

type SortableCourt = Pick<Tables<"courts">, "id" | "name" | "sponsored_until" | "sponsor_priority">;

/** A court's sponsorship is active — i.e. it's a paying ("official") court — right now. */
export function isCourtSponsored(court: Pick<SortableCourt, "sponsored_until">): boolean {
  return court.sponsored_until != null && new Date(court.sponsored_until) > new Date();
}

/**
 * Orders courts for the create-match picker: actively sponsored courts first
 * (higher `sponsor_priority` first), then the rest alphabetically. Pure and
 * stable so it's easy to unit test.
 */
export function sortCourtsForPicker<T extends SortableCourt>(courts: T[]): T[] {
  return [...courts].sort((a, b) => {
    const aSponsored = isCourtSponsored(a);
    const bSponsored = isCourtSponsored(b);
    if (aSponsored !== bSponsored) return aSponsored ? -1 : 1;
    if (aSponsored && bSponsored && a.sponsor_priority !== b.sponsor_priority) {
      return b.sponsor_priority - a.sponsor_priority;
    }
    return a.name.localeCompare(b.name);
  });
}
