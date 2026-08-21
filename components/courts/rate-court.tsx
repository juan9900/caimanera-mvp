"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { rateCourt } from "@/app/actions/ratings";

/**
 * Interactive 1-5 star picker for the court detail page. Preloaded with the
 * user's existing rating (if any); clicking a star immediately calls
 * `rateCourt` and optimistically shows the new selection, reverting if the
 * action fails. Mirrors the optimistic-update + `useTransition` pattern in
 * `components/matches/match-visibility-switch.tsx`.
 */
export function RateCourt({ courtId, myRating }: { courtId: string; myRating: number | null }) {
  const [rating, setRating] = useState(myRating ?? 0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(n: number) {
    if (n === rating) return;
    setError(null);
    const previous = rating;
    setRating(n);
    startTransition(async () => {
      const result = await rateCourt(courtId, n);
      if (result?.message) {
        setRating(previous);
        setError(result.message);
      }
    });
  }

  const shown = hovered ?? rating;

  return (
    <div>
      <p className="mb-1 font-body text-xs text-on-surface-variant">
        {rating > 0 ? "Tu calificación" : "Calificar esta ubicación"}
      </p>
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={isPending}
            onClick={() => handleClick(n)}
            onMouseEnter={() => setHovered(n)}
            aria-label={`Calificar con ${n} estrella${n > 1 ? "s" : ""}`}
            className="p-0.5 disabled:cursor-not-allowed"
          >
            <Star
              aria-hidden
              size={24}
              className={n <= shown ? "fill-primary-lime text-primary-lime" : "text-on-surface-variant"}
            />
          </button>
        ))}
      </div>
      {error && <p className="mt-1 font-body text-xs text-dark-error">{error}</p>}
    </div>
  );
}
