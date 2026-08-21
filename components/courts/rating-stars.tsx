import { Star } from "lucide-react";

/**
 * Read-only rating display for a court, shared by the detail page, the map
 * pin badge and the `/mapa` drawer cards. Purely presentational — callers
 * pass the aggregate straight from `courts.rating_avg`/`rating_count`.
 *
 * `variant="compact"` (badge/cards): a single filled star + "avg (count)".
 * `variant="detail"` (court page): a row of 5 stars filled by the average.
 * With `count === 0` there's nothing to average, so both variants fall back
 * to a muted "Sin calificaciones" instead of showing "0.0 (0)".
 */
export function RatingStars({
  avg,
  count,
  variant = "compact",
}: {
  avg: number;
  count: number;
  variant?: "compact" | "detail";
}) {
  if (count === 0) {
    return <span className="font-body text-xs text-on-surface-variant">Sin calificaciones</span>;
  }

  if (variant === "detail") {
    const rounded = Math.round(avg);
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              aria-hidden
              size={16}
              className={n <= rounded ? "fill-primary-lime text-primary-lime" : "text-on-surface-variant"}
            />
          ))}
        </div>
        <span className="font-body text-sm text-on-surface-variant">
          {avg.toFixed(1)} ({count})
        </span>
      </div>
    );
  }

  return (
    <span className="flex items-center gap-1 font-body text-xs text-on-surface-variant">
      <Star aria-hidden size={12} className="fill-primary-lime text-primary-lime" />
      {avg.toFixed(1)} ({count})
    </span>
  );
}
