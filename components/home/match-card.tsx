import Link from "next/link";
import { SPORT_LABELS, slotsNeeded, type HomeMatch } from "@/lib/matches/home";

export function formatRelativeDateTime(isoDatetime: string): string {
  const date = new Date(isoDatetime);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);

  const time = date.toLocaleTimeString("es-VE", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (dayDiff === 0) return `Hoy, ${time}`;
  if (dayDiff === 1) return `Mañana, ${time}`;
  return `${date.toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "short" })}, ${time}`;
}

/**
 * Card for a single match: court, relative time, sport, and an urgency
 * badge. Shared by "Sesiones públicas" (public) and "De tus amigos" (private)
 * — `hideBadgeWhenFull` suppresses the "Faltan 0" badge for the latter,
 * where a friend's match may already be full.
 */
export function MatchCard({
  match,
  distanceLabel,
  hideBadgeWhenFull = false,
}: {
  match: HomeMatch;
  distanceLabel?: string;
  hideBadgeWhenFull?: boolean;
}) {
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-on-surface">
            {match.court?.name ?? "Cancha"} ·{" "}
            {SPORT_LABELS[match.sport] ?? match.sport}
          </p>
          <p
            className={`mt-1 font-body text-sm ${alreadyStarted ? "font-semibold text-dark-error" : "text-on-surface-variant"}`}
          >
            {alreadyStarted
              ? "Ya comenzó"
              : formatRelativeDateTime(match.datetime)}
            {distanceLabel ? ` · ${distanceLabel}` : ""}
          </p>
        </div>
        {(!hideBadgeWhenFull || needed > 0) && (
          <span className="flex shrink-0 items-center rounded-full border border-primary-lime/50 bg-secondary-container/30 px-3 py-1">
            <span className="font-label text-xs font-bold text-primary-lime">
              {needed === 1 ? "Falta 1" : `Faltan ${needed}`}
            </span>
          </span>
        )}
      </div>
      {match.organizer?.name && (
        <p className="font-body text-sm text-on-surface-variant">
          Org. por{" "}
          <span className="text-on-surface">{match.organizer.name}</span>
        </p>
      )}
    </Link>
  );
}
