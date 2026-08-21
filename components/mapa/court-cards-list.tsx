"use client";

import { useEffect, useRef } from "react";
import { Clock, MapPin } from "lucide-react";
import { getSport, SportIcon } from "@/lib/courts/sports";
import { formatTodayHours } from "@/lib/courts/hours";
import { AmenityIcons } from "@/components/courts/amenity-icons";
import { RatingStars } from "@/components/courts/rating-stars";
import type { Court } from "@/lib/auth/dal";

/** Vertically stacked list of court cards under the `/mapa` map — mirrors selection with the pin the user tapped. */
export function CourtCardsList({
  courts,
  selectedId,
  onSelect,
  onShowOnMap,
  distanceByCourtId,
}: {
  courts: Court[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onShowOnMap: (court: Court) => void;
  distanceByCourtId?: Map<string, string>;
}) {
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!selectedId) return;
    cardRefs.current.get(selectedId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  if (courts.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center px-4 text-center font-body text-sm text-on-surface-variant">
        No hay canchas con ese filtro.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {courts.map((court) => {
        const image = court.is_official ? (court.photos?.[0] ?? court.logo_url ?? null) : null;
        const sports = (court.sports ?? []).map(getSport).filter((s) => s !== undefined);

        return (
          <button
            key={court.id}
            type="button"
            ref={(el) => {
              if (el) cardRefs.current.set(court.id, el);
              else cardRefs.current.delete(court.id);
            }}
            onClick={() => onShowOnMap(court)}
            onMouseEnter={() => onSelect(court.id)}
            onFocus={() => onSelect(court.id)}
            className={`flex items-center gap-3 rounded-xl border bg-surface-container p-3 text-left transition-transform active:scale-[0.98] ${
              court.id === selectedId ? "border-primary-lime" : "border-surface-variant/50"
            }`}
          >
            {court.is_official && (
              <div className="flex shrink-0 flex-col items-center gap-1">
                <div
                  className="h-20 w-20 rounded-lg bg-surface-variant bg-cover bg-center"
                  style={image ? { backgroundImage: `url(${image})` } : undefined}
                />
                <RatingStars avg={court.rating_avg} count={court.rating_count} />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-display text-sm font-bold text-on-surface">{court.name}</p>
                {court.is_official && (
                  <span className="shrink-0 rounded-full bg-secondary-container/90 px-2 py-0.5 font-label text-[10px] font-bold text-on-secondary-container">
                    Oficial
                  </span>
                )}
              </div>

              {court.address && (
                <p className="truncate font-body text-xs text-on-surface-variant">{court.address}</p>
              )}

              <div className="flex items-center gap-2">
                {distanceByCourtId?.get(court.id) && (
                  <span className="flex items-center gap-1 font-label text-[10px] font-bold text-primary-lime">
                    <MapPin aria-hidden size={10} />
                    {distanceByCourtId.get(court.id)}
                  </span>
                )}

                {sports.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sports.map(({ key, label }) => (
                      <span
                        key={key}
                        title={label}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-variant text-primary-lime"
                      >
                        <SportIcon sport={key} size={11} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {!court.is_official && (
                <RatingStars avg={court.rating_avg} count={court.rating_count} />
              )}

              {court.is_official && (
                <>
                  <p className="flex items-center gap-1 font-body text-xs text-on-surface-variant">
                    <Clock aria-hidden size={11} />
                    {formatTodayHours(court)}
                  </p>
                  <AmenityIcons amenities={court.amenities} size="sm" tone="dark" />
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
