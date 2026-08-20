"use client";

import { getSport, SportIcon } from "@/lib/courts/sports";

/**
 * Pill button for one sport, shared by the home "Sesiones públicas" filter
 * (icon-only, multi-select) and the `/mapa` filter row (icon + label,
 * single-select) — both need the exact same glyph/active styling, so the
 * selection mode (single vs multi) is left to the caller via `onClick`.
 */
export function SportChip({
  sportKey,
  active,
  onClick,
  showLabel = true,
}: {
  sportKey: string;
  active: boolean;
  onClick: () => void;
  showLabel?: boolean;
}) {
  const sport = getSport(sportKey);
  if (!sport) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={sport.label}
      title={sport.label}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border transition-colors ${
        showLabel ? "px-3 py-1.5" : "h-10 w-10 justify-center"
      } font-label text-xs font-bold uppercase tracking-wide ${
        active
          ? "border-primary-lime bg-primary-lime text-on-primary"
          : "border-surface-variant bg-surface-container text-on-surface hover:border-primary-lime/50"
      }`}
    >
      <SportIcon sport={sportKey} size={showLabel ? 13 : 18} />
      {showLabel && sport.label}
    </button>
  );
}
