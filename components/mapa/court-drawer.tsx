"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { CourtCardsList } from "@/components/mapa/court-cards-list";
import type { Court } from "@/lib/auth/dal";

/**
 * Collapsible bottom sheet over the `/mapa` map: a thin summary bar
 * ("N lugares cerca") when closed, expanding to a tall scrollable
 * `CourtCardsList` when tapped open. Sits over the map (`MapExperience`
 * wraps the map itself in an `isolate` layer so Leaflet's internal
 * z-index — its controls go up to 1000 — can't paint above this).
 */
export function CourtDrawer({
  courts,
  open,
  onToggle,
  selectedId,
  onSelect,
  onShowOnMap,
  distanceByCourtId,
}: {
  courts: Court[];
  open: boolean;
  onToggle: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onShowOnMap: (court: Court) => void;
  distanceByCourtId?: Map<string, string>;
}) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-surface shadow-[0_-4px_16px_rgba(0,0,0,0.35)] transition-[height] duration-300 ease-out ${
        open ? "h-[70vh]" : "h-14"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex shrink-0 items-center justify-between px-4 py-3"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-label text-sm font-bold text-on-surface">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-lime" aria-hidden />
          {courts.length} {courts.length === 1 ? "lugar cerca" : "lugares cerca"}
        </span>
        {open ? (
          <ChevronDown aria-hidden size={18} className="text-on-surface-variant" />
        ) : (
          <ChevronUp aria-hidden size={18} className="text-on-surface-variant" />
        )}
      </button>

      {open && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CourtCardsList
            courts={courts}
            selectedId={selectedId}
            onSelect={onSelect}
            onShowOnMap={onShowOnMap}
            distanceByCourtId={distanceByCourtId}
          />
        </div>
      )}
    </div>
  );
}
