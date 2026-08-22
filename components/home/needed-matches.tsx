import Link from "next/link";
import type { HomeMatch } from "@/lib/matches/home";
import { MatchCard } from "@/components/home/match-card";
import { SPORTS } from "@/lib/courts/sports";
import { SportChip } from "@/components/courts/sport-chip";

/**
 * "Sesiones públicas" section: matches needing players, most urgent first.
 * `hasAnyPublicMatches` distinguishes "nothing matches the current filters"
 * from "there are literally zero public matches right now" (private ones
 * don't count — they're invite-only, see `setMatchVisibility`), so each case
 * gets its own empty state. The sport filter row (icon + label, multi-select,
 * same glyphs as `/mapa`) lives right below the title.
 */
export function NeededMatches({
  matches,
  hasAnyPublicMatches = true,
  distanceByCourtId,
  radiusKm,
  canExpandRadius = false,
  showExpandRadius = false,
  onExpandRadius,
  sportFilter,
  onToggleSport,
}: {
  matches: HomeMatch[];
  hasAnyPublicMatches?: boolean;
  distanceByCourtId?: Map<string, string>;
  /** Current radius (km) applied around the user's location, if any. */
  radiusKm?: number;
  /** Whether there's a wider step left to expand to. */
  canExpandRadius?: boolean;
  /** Show the "ampliar rango" affordance: nothing within `radiusKm`, but public matches exist further away. */
  showExpandRadius?: boolean;
  onExpandRadius?: () => void;
  /** Sport keys currently selected (empty = all sports). */
  sportFilter: string[];
  onToggleSport: (sportKey: string) => void;
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

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {SPORTS.map(({ key }) => (
          <SportChip
            key={key}
            sportKey={key}
            active={sportFilter.includes(key)}
            onClick={() => onToggleSport(key)}
          />
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center">
          <p className="font-body font-medium text-on-surface">
            {showExpandRadius
              ? `Ningún partido a menos de ${radiusKm} km`
              : hasAnyPublicMatches
                ? "Ningún partido necesita gente ahorita"
                : "Por el momento no hay sesiones públicas"}
          </p>
          {showExpandRadius && canExpandRadius ? (
            <button
              type="button"
              onClick={onExpandRadius}
              className="mt-3 inline-block rounded-lg border border-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-primary-lime"
            >
              Ampliar rango de búsqueda
            </button>
          ) : (
            <Link
              href="/partidos/nuevo"
              className="mt-3 inline-block rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary"
            >
              Crear partido
            </Link>
          )}
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
