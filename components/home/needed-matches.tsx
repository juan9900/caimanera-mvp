import Link from "next/link";
import type { HomeMatch } from "@/lib/matches/home";
import { MatchCard } from "@/components/home/match-card";

/**
 * "Sesiones públicas" section: matches needing players, most urgent first.
 * `hasAnyPublicMatches` distinguishes "nothing matches the current filters"
 * from "there are literally zero public matches right now" (private ones
 * don't count — they're invite-only, see `setMatchVisibility`), so each case
 * gets its own empty state.
 */
export function NeededMatches({
  matches,
  hasAnyPublicMatches = true,
  distanceByCourtId,
}: {
  matches: HomeMatch[];
  hasAnyPublicMatches?: boolean;
  distanceByCourtId?: Map<string, string>;
}) {
  return (
    <section className="px-4 py-2">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-on-surface">
          Sesiones públicas
        </h2>
        <Link
          href="/partidos"
          className="font-label text-xs font-bold uppercase tracking-wider text-primary-lime"
        >
          Ver todos
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center">
          <p className="font-body font-medium text-on-surface">
            {hasAnyPublicMatches
              ? "Ningún partido necesita gente ahorita"
              : "Por el momento no hay sesiones públicas"}
          </p>
          <Link
            href="/partidos/nuevo"
            className="mt-3 inline-block rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)]"
          >
            Crear partido
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((match) => (
            <li key={match.id}>
              <MatchCard
                match={match}
                distanceLabel={
                  match.court
                    ? distanceByCourtId?.get(match.court.id)
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
