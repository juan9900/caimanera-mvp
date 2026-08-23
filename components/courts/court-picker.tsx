"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { AmenityIcons } from "@/components/courts/amenity-icons";
import { formatTodayHours } from "@/lib/courts/hours";
import { isCourtSponsored } from "@/lib/courts/sort";
import type { Court } from "@/lib/auth/dal";

/** A court matches free-text search by its own name. */
function matchesSearch(court: Court, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return court.name.toLowerCase().includes(q);
}

/**
 * Collapsible court selector for the create-match form. Renders a trigger
 * button (native `<select>`-like, but courts need richer per-option content
 * than a plain option string can show) that expands into a list of cards —
 * each tagged with an "Oficial"/"Patrocinado" badge; official courts also
 * show today's opening hours top-right — instead of always rendering every
 * court at once.
 */
export function CourtPicker({
  courts,
  selectedId,
  onSelect,
}: {
  courts: Court[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedCourt = courts.find((c) => c.id === selectedId) ?? null;
  const filteredCourts = courts.filter((court) => matchesSearch(court, search));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          setSearch("");
        }}
        className="flex w-full items-center justify-between rounded-lg border border-surface-variant bg-surface-container px-3 py-2 text-left font-body text-on-surface"
      >
        <span className={selectedCourt ? "" : "text-on-surface-variant"}>
          {selectedCourt ? selectedCourt.name : "Selecciona una cancha"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-surface-variant bg-surface p-2 shadow-lg">
          {courts.length > 5 && (
            <div className="relative mb-2">
              <Search
                aria-hidden
                size={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cancha..."
                autoFocus
                className="w-full rounded-lg border border-surface-variant bg-surface-container py-2 pl-8 pr-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary-lime focus:outline-none"
              />
            </div>
          )}
          <div className="grid max-h-72 gap-2 overflow-y-auto">
            {filteredCourts.length === 0 && (
              <p className="px-2 py-3 text-center font-body text-sm text-on-surface-variant">
                No se encontraron canchas.
              </p>
            )}
            {filteredCourts.map((court) => {
              const selected = court.id === selectedId;
              const sponsored = isCourtSponsored(court);
              return (
                <label
                  key={court.id}
                  className={`relative flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 ${
                    court.is_official ? "pr-24" : ""
                  } ${
                    selected
                      ? "border-primary-lime bg-primary-lime/10"
                      : "border-surface-variant/50 bg-surface-container"
                  }`}
                >
                  <input
                    type="radio"
                    checked={selected}
                    onChange={() => {
                      onSelect(court.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="sr-only"
                  />
                  {court.is_official && (
                    <span className="absolute top-3 right-3 rounded-full bg-surface-variant px-2 py-0.5 font-label text-[10px] font-bold whitespace-nowrap text-on-surface-variant">
                      {formatTodayHours(court)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-body font-medium text-on-surface">
                      {court.name}
                      {court.is_official && (
                        <span className="rounded-full bg-primary-lime px-2 py-0.5 font-label text-xs font-bold text-on-primary">
                          Oficial
                        </span>
                      )}
                      {!court.is_official && sponsored && (
                        <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 font-label text-xs font-bold text-primary-lime">
                          Patrocinado
                        </span>
                      )}
                    </p>
                    <AmenityIcons amenities={court.amenities} size="sm" tone="dark" className="mt-1.5" />
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
