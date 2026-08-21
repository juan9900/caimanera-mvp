"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MatchWithCourt } from "@/lib/auth/dal";
import { SPORT_LABELS } from "@/lib/matches/home";
import { SPORTS } from "@/lib/courts/sports";
import { SportChip } from "@/components/courts/sport-chip";
import { SegmentedControl } from "@/components/segmented-control";

const VIBE_LABELS: Record<string, string> = {
  relajado: "Relajado",
  competitivo: "Competitivo",
};
const STATUS_LABELS: Record<string, string> = {
  abierto: "Abierto",
  completo: "Completo",
  cancelado: "Cancelado",
  vencido: "Vencido",
};

function MatchListItem({ match, showOrganizer }: { match: MatchWithCourt; showOrganizer: boolean }) {
  const started = new Date(match.datetime) < new Date();
  // "Ya comenzó" only reads right for a match that just started and is still
  // `abierto` (before the expiry cron flips it to `vencido`) — for anything
  // older than that, showing the actual date is more useful than a vague
  // "it already started".
  const justStarted = started && match.status === "abierto";

  return (
    <li>
      <Link
        href={`/partidos/${match.id}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-surface-variant/50 bg-surface-container p-4 transition-transform active:scale-[0.98]"
      >
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-display font-bold text-on-surface">
            {match.court?.name ?? "Cancha"} · {SPORT_LABELS[match.sport] ?? match.sport}
            {match.status !== "abierto" && (
              <span className="rounded-full bg-surface-variant px-2 py-0.5 font-label text-xs font-bold text-on-surface-variant">
                {STATUS_LABELS[match.status]}
              </span>
            )}
            {match.visibility !== "publica" && (
              <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 font-label text-xs font-bold text-on-secondary-container">
                {match.visibility === "amigos" ? "Amigos" : "Privada"}
              </span>
            )}
          </p>
          <p className="font-body text-sm text-on-surface-variant">
            <span className={justStarted ? "font-semibold text-dark-error" : undefined}>
              {justStarted
                ? "Ya comenzó"
                : new Date(match.datetime).toLocaleString("es-VE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
            </span>{" "}
            · {VIBE_LABELS[match.vibe]}
            {showOrganizer ? ` · organiza ${match.organizer?.name ?? "alguien"}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-variant px-2 py-0.5 font-label text-xs font-bold text-on-surface">
          {match.slots_filled}/{match.total_slots}
        </span>
      </Link>
    </li>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center font-body text-on-surface-variant">
      {children}
    </p>
  );
}

/**
 * Segmented control: "Explorar" (public matches, filterable by sport) vs.
 * "Mis partidos" (organized + joined). Both lists stay vertical — a
 * horizontal carousel would hurt scannability for a browse-to-decide list —
 * the tabs are what visually separate "discover" from "mine".
 */
export function PartidosClient({
  openMatches,
  myMatches,
}: {
  openMatches: MatchWithCourt[];
  myMatches: MatchWithCourt[];
}) {
  const [tab, setTab] = useState<"explorar" | "mis">("explorar");
  const [sportFilter, setSportFilter] = useState<string[]>([]);
  const [showPast, setShowPast] = useState(false);

  const filteredOpenMatches = useMemo(
    () =>
      sportFilter.length === 0
        ? openMatches
        : openMatches.filter((m) => sportFilter.includes(m.sport)),
    [openMatches, sportFilter],
  );

  const { activeMyMatches, pastMyMatches } = useMemo(() => {
    const now = new Date();
    const active: MatchWithCourt[] = [];
    const past: MatchWithCourt[] = [];
    for (const match of myMatches) {
      const isPast = match.status === "vencido" || new Date(match.datetime) < now;
      (isPast ? past : active).push(match);
    }
    past.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    return { activeMyMatches: active, pastMyMatches: past };
  }, [myMatches]);

  function toggleSport(sportKey: string) {
    setSportFilter((current) =>
      current.includes(sportKey) ? current.filter((k) => k !== sportKey) : [...current, sportKey],
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SegmentedControl
          options={[
            { value: "explorar", label: "Explorar" },
            {
              value: "mis",
              label: `Mis partidos${myMatches.length > 0 ? ` (${myMatches.length})` : ""}`,
            },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "explorar" ? (
        <div>
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
            {SPORTS.map(({ key }) => (
              <SportChip key={key} sportKey={key} active={sportFilter.includes(key)} onClick={() => toggleSport(key)} />
            ))}
          </div>

          {filteredOpenMatches.length === 0 ? (
            <EmptyState>
              {sportFilter.length > 0
                ? "Ningún partido abierto con ese deporte."
                : "Todavía no hay partidos abiertos. Arma el primero."}
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {filteredOpenMatches.map((match) => (
                <MatchListItem key={match.id} match={match} showOrganizer />
              ))}
            </ul>
          )}
        </div>
      ) : myMatches.length === 0 ? (
        <div className="flex flex-col items-center gap-3">
          <EmptyState>Todavía no organizas ni te uniste a ningún partido.</EmptyState>
          <Link
            href="/partidos/nuevo"
            className="rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)]"
          >
            Armar partido
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeMyMatches.length === 0 ? (
            <EmptyState>No tienes partidos activos por ahora.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {activeMyMatches.map((match) => (
                <MatchListItem key={match.id} match={match} showOrganizer={false} />
              ))}
            </ul>
          )}

          {pastMyMatches.length > 0 && (
            <div className="rounded-xl border border-surface-variant/50 bg-surface-container p-3">
              <button
                type="button"
                onClick={() => setShowPast((prev) => !prev)}
                aria-expanded={showPast}
                className="flex w-full items-center justify-between font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant"
              >
                <span>Partidos pasados ({pastMyMatches.length})</span>
                <span aria-hidden="true">{showPast ? "▾" : "▸"}</span>
              </button>
              {showPast && (
                <ul className="mt-3 flex flex-col gap-3">
                  {pastMyMatches.map((match) => (
                    <MatchListItem key={match.id} match={match} showOrganizer={false} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
