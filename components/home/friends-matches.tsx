import type { HomeMatch } from "@/lib/matches/home";
import { MatchCard } from "@/components/home/match-card";

/**
 * "De tus amigos" section: `visibility = "amigos"` matches organized by one
 * of the current user's accepted friends — surfaced above the public "Te
 * necesitan ya" list so the social circle comes first. Unlike that list,
 * this shows every open match regardless of how many slots are left (a
 * friend's match is worth seeing even if it's full), and it's independent
 * of the quick filters. Renders nothing when there's nothing to show, so it
 * never clutters the home for users without friends' open "amigos" matches.
 */
export function FriendsMatches({
  matches,
  distanceByCourtId,
}: {
  matches: HomeMatch[];
  distanceByCourtId?: Map<string, string>;
}) {
  if (matches.length === 0) return null;

  return (
    <section className="px-4 py-2">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-on-surface">De tus amigos</h2>
      </div>

      <ul className="flex flex-col gap-3">
        {matches.map((match) => (
          <li key={match.id}>
            <MatchCard
              match={match}
              distanceLabel={match.court ? distanceByCourtId?.get(match.court.id) : undefined}
              hideBadgeWhenFull
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
