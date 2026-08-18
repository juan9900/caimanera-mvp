import Link from "next/link";
import { SPORT_LABELS, slotsNeeded, type HomeMatch } from "@/lib/matches/home";

function formatRelativeDateTime(isoDatetime: string): string {
  const date = new Date(isoDatetime);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);

  const time = date.toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit" });

  if (dayDiff === 0) return `Hoy, ${time}`;
  if (dayDiff === 1) return `Mañana, ${time}`;
  return `${date.toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "short" })}, ${time}`;
}

/** Card for a single "needs players" match: court, relative time, sport, and an urgency badge. */
function MatchCard({ match, distanceLabel }: { match: HomeMatch; distanceLabel?: string }) {
  const needed = slotsNeeded(match);
  // Only reopened matches reach here with a past datetime (the expiry cron marks
  // matches "vencido" — and out of this "abierto"-only list — as soon as they
  // start; a reopened one keeps its original, now-past, start time).
  const alreadyStarted = new Date(match.datetime) < new Date();

  return (
    <Link
      href={`/partidos/${match.id}`}
      className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-surface-variant/50 bg-surface-container p-4 transition-transform active:scale-[0.98]"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-lime/10 blur-2xl" />
      <div className="z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-on-surface">
            {match.court?.name ?? "Cancha"} · {SPORT_LABELS[match.sport] ?? match.sport}
          </p>
          <p
            className={`mt-1 font-body text-sm ${alreadyStarted ? "font-semibold text-dark-error" : "text-on-surface-variant"}`}
          >
            {alreadyStarted ? "Ya comenzó" : formatRelativeDateTime(match.datetime)}
            {distanceLabel ? ` · ${distanceLabel}` : ""}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full border border-primary-lime/50 bg-secondary-container/30 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-primary-lime animate-pulse" />
          <span className="font-label text-xs font-bold text-primary-lime">
            {needed === 1 ? "Falta 1" : `Faltan ${needed}`}
          </span>
        </span>
      </div>
      {match.organizer?.name && (
        <p className="z-10 font-body text-sm text-on-surface-variant">
          Org. por <span className="text-on-surface">{match.organizer.name}</span>
        </p>
      )}
    </Link>
  );
}

/**
 * "Te necesitan ya" section: matches needing players, most urgent first.
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
        <h2 className="font-display text-xl font-bold text-on-surface">Te necesitan ya</h2>
        <Link href="/partidos" className="font-label text-xs font-bold uppercase tracking-wider text-primary-lime">
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
                distanceLabel={match.court ? distanceByCourtId?.get(match.court.id) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
