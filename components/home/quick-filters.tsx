"use client";

import { SPORT_LABELS } from "@/lib/matches/home";

export type QuickFilterState = {
  sports: string[];
  today: boolean;
  nearMe: boolean;
};

const SPORT_CHIPS = Object.keys(SPORT_LABELS);

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-4 py-2 font-label text-sm font-bold transition-colors ${
        active
          ? "border-primary-lime bg-primary-lime/10 text-primary-lime"
          : "border-surface-variant text-on-surface hover:border-primary-lime/50"
      }`}
    >
      {children}
    </button>
  );
}

/** Row of one-tap filter chips (sport, hoy, cerca de mí) that filter "Te necesitan ya" in-place. */
export function QuickFilters({
  value,
  onChange,
  nearMeAvailable,
}: {
  value: QuickFilterState;
  onChange: (next: QuickFilterState) => void;
  nearMeAvailable: boolean;
}) {
  function toggleSport(sport: string) {
    const sports = value.sports.includes(sport)
      ? value.sports.filter((s) => s !== sport)
      : [...value.sports, sport];
    onChange({ ...value, sports });
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3">
      {SPORT_CHIPS.map((sport) => (
        <Chip key={sport} active={value.sports.includes(sport)} onClick={() => toggleSport(sport)}>
          {SPORT_LABELS[sport]}
        </Chip>
      ))}
      <Chip active={value.today} onClick={() => onChange({ ...value, today: !value.today })}>
        Hoy
      </Chip>
      <Chip
        active={value.nearMe}
        onClick={() => nearMeAvailable && onChange({ ...value, nearMe: !value.nearMe })}
      >
        Cerca de mí
      </Chip>
    </div>
  );
}
