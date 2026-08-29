"use client";

import { TileLayer } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { BadgeCheck, MapPinned } from "lucide-react";
import { getSport, SportIcon } from "@/lib/courts/sports";
import { renderIconSvg, renderIconSource } from "@/lib/icons/svg-icon";
import { RatingStars } from "@/components/courts/rating-stars";

// CARTO's free "dark_all" basemap — no API key required. Matches the app's
// "High-Velocity" dark theme instead of Leaflet's default light OpenStreetMap
// tiles. Falls back to OSM data under the hood, so OSM is credited too.
const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Dark-themed tile layer shared by every map in the app. */
export function DarkTiles() {
  return (
    <TileLayer
      attribution={DARK_TILE_ATTRIBUTION}
      url={DARK_TILE_URL}
      subdomains="abcd"
      maxZoom={20}
    />
  );
}

// Fallback pin glyph (lucide `MapPin`) used when a court has no sport set —
// there's nothing to represent, so it falls back to a plain location marker.
const GENERIC_PIN_NODE = renderIconSvg(
  [
    ["path", { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }],
    ["circle", { cx: "12", cy: "10", r: "3" }],
  ],
  { size: 14, color: "#c3f400" },
);

const iconCache = new Map<string, L.DivIcon>();

const MAX_PIN_SPORTS = 3;

/**
 * Which of a court's sports to show as icons on its pin, and in what order:
 * the viewer's favorite sports that this court offers come first (in the
 * viewer's preference order), then the court's remaining sports fill any
 * leftover slots (in catalog order) — capped at `MAX_PIN_SPORTS`. Without
 * `preferredSports` (e.g. logged-out previews) this is just the court's own
 * sports in order.
 */
function pickPinSports(sports: string[], preferredSports: string[] | undefined): string[] {
  const favorites = (preferredSports ?? []).filter((key) => sports.includes(key));
  const rest = sports.filter((key) => !favorites.includes(key));
  return [...favorites, ...rest].slice(0, MAX_PIN_SPORTS);
}

/** "+N" label appended after the 3 sport icons when a court offers more than `MAX_PIN_SPORTS`. */
function overflowLabel(count: number): string {
  return `<span class="font-display text-[11px] font-extrabold leading-none text-primary-lime">+${count}</span>`;
}

// Lucide `badge-check` glyph — same icon as the "Oficial" chip everywhere
// else in the app (court-hero, official-upsell), so the pin badge reads as
// the same "verified" signal instead of a generic checkmark.
const OFFICIAL_BADGE_GLYPH = renderIconSvg(
  [
    [
      "path",
      {
        d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
      },
    ],
    ["path", { d: "m9 12 2 2 4-4" }],
  ],
  { size: 11, color: "currentColor", strokeWidth: 2.5 },
);

// Lucide `globe` glyph — used for the "Lugar público" pin badge and popup
// chip, distinct from the `badge-check` "Oficial" glyph so the two signals
// (verified partner vs. free/open place) don't read as the same thing.
const PUBLIC_BADGE_GLYPH = renderIconSvg(
  [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
    ["path", { d: "M2 12h20" }],
  ],
  { size: 11, color: "currentColor", strokeWidth: 2.5 },
);

/**
 * Dark pin with lime glyphs inside: a court's sport icon(s), prioritizing
 * the viewer's favorite sports (`opts.preferredSports`, from
 * `profile.sport_preferences`) — see `pickPinSports`. Zero sports falls back
 * to a generic location pin; one sport is a round badge with its icon;
 * two or three render as a horizontal pill; a court with more than
 * `MAX_PIN_SPORTS` sports (so the pill would need a 4th "+N" tail cell)
 * switches to a compact 2x2 grid instead of cramming 4 cells into one row.
 * Official courts get a small "verified" badge on the corner of the pin, and public places
 * (free/open courts) get a "globe" badge instead — official takes priority
 * if a court is somehow both, so the pin never has to stack two badges.
 * Used by every court marker in the app (display maps, picker, home card,
 * `/mapa`).
 */
export function buildCourtIcon(
  sports: string[] | null | undefined,
  opts: { selected?: boolean; official?: boolean; public?: boolean; preferredSports?: string[] } = {},
): L.DivIcon {
  const key = `${(sports ?? []).join(",")}|${(opts.preferredSports ?? []).join(",")}|${opts.selected ? "sel" : ""}|${opts.official ? "off" : ""}|${opts.public ? "pub" : ""}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const allSports = sports ?? [];
  const shown = pickPinSports(allSports, opts.preferredSports);
  const overflow = allSports.length - shown.length;

  const badge = opts.official
    ? `<span class="absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-secondary-container text-on-secondary-container ring-2 ring-surface-container" style="width:16px;height:16px">${OFFICIAL_BADGE_GLYPH}</span>`
    : opts.public
      ? `<span class="absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-primary-lime text-on-primary ring-2 ring-surface-container" style="width:16px;height:16px">${PUBLIC_BADGE_GLYPH}</span>`
      : "";

  let icon: L.DivIcon;

  if (shown.length <= 1) {
    // Zero or one sport: the original round badge.
    const single = shown.length === 1 ? getSport(shown[0]) : undefined;
    const glyph = single ? renderIconSource(single.icon, { size: 14, color: "#c3f400" }) : GENERIC_PIN_NODE;
    const size = opts.selected ? 40 : 32;

    icon = L.divIcon({
      className: "",
      html: `<span class="relative flex items-center justify-center rounded-full bg-surface-container ${
        opts.selected ? "border-2 border-primary-lime shadow-[0_0_0_4px_rgba(195,244,0,0.25)]" : "border border-primary-lime/70"
      } shadow-md" style="width:${size}px;height:${size}px">${glyph}${badge}</span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  } else if (shown.length === MAX_PIN_SPORTS && overflow > 0) {
    // Exactly 4 cells to show (3 sport icons + the "+N" tail): a 2x2 grid
    // reads much more compactly than cramming 4 elements into one row.
    const iconSize = 13;
    const gap = 3;
    const pad = opts.selected ? 13 : 9;
    const size = iconSize * 2 + gap + pad * 2;

    const cells = [...shown, null].map((sportKey) => {
      const glyph = sportKey
        ? (() => {
            const sport = getSport(sportKey);
            return sport ? renderIconSource(sport.icon, { size: iconSize, color: "#c3f400" }) : "";
          })()
        : overflowLabel(overflow);
      return `<span class="flex items-center justify-center">${glyph}</span>`;
    });

    icon = L.divIcon({
      className: "",
      html: `<span class="relative grid grid-cols-2 grid-rows-2 place-items-center rounded-2xl bg-surface-container ${
        opts.selected ? "border-2 border-primary-lime shadow-[0_0_0_4px_rgba(195,244,0,0.25)]" : "border border-primary-lime/70"
      } shadow-md" style="width:${size}px;height:${size}px;gap:${gap}px;padding:${pad}px;box-sizing:border-box">${cells.join("")}${badge}</span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  } else {
    // Several sports: a horizontal pill of icons (+ "+N" tail if the court offers more than shown).
    // Width is computed (not left to CSS auto-sizing) so it matches the
    // `iconSize`/`iconAnchor` Leaflet needs to place and center the marker.
    const iconSize = 13;
    const gap = 4;
    const padX = 10; // matches the wrapper's `px-2.5`
    const tailWidth = overflow > 0 ? 16 : 0;
    const contentWidth =
      shown.length * iconSize + (shown.length - 1) * gap + (overflow > 0 ? gap + tailWidth : 0);
    const width = contentWidth + padX * 2;
    const height = opts.selected ? 40 : 32;

    const glyphs = shown
      .map((sportKey) => {
        const sport = getSport(sportKey);
        return sport ? renderIconSource(sport.icon, { size: iconSize, color: "#c3f400" }) : "";
      })
      .join("");
    const tail = overflow > 0 ? overflowLabel(overflow) : "";

    icon = L.divIcon({
      className: "",
      html: `<span class="relative flex items-center justify-center rounded-full bg-surface-container px-2.5 ${
        opts.selected ? "border-2 border-primary-lime shadow-[0_0_0_4px_rgba(195,244,0,0.25)]" : "border border-primary-lime/70"
      } shadow-md" style="width:${width}px;height:${height}px;gap:${gap}px">${glyphs}${tail}${badge}</span>`,
      iconSize: [width, height],
      iconAnchor: [width / 2, height / 2],
      popupAnchor: [0, -height / 2],
    });
  }

  iconCache.set(key, icon);
  return icon;
}

/**
 * Popup body shared by every court marker's `<Popup>`: court name, a chip
 * row of its sports when it offers more than one (so a multi-cancha complex
 * like a "cantera" reads clearly), and an optional link to the court page.
 */
export function CourtPopupContent({
  name,
  address,
  sports,
  href,
  ratingAvg,
  ratingCount,
  official,
  isPublic,
}: {
  name: string;
  address?: string | null;
  sports?: string[] | null;
  href?: string;
  ratingAvg?: number;
  ratingCount?: number;
  official?: boolean;
  isPublic?: boolean;
}) {
  const multi = sports && sports.length > 1;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-on-surface">{name}</span>
        {official && (
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-secondary-container/90 px-1.5 py-0.5 font-label text-[10px] font-bold text-on-secondary-container">
            <BadgeCheck aria-hidden size={11} />
            Oficial
          </span>
        )}
        {!official && isPublic && (
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary-lime/90 px-1.5 py-0.5 font-label text-[10px] font-bold text-on-primary">
            <MapPinned aria-hidden size={11} />
            Lugar público
          </span>
        )}
      </div>
      {address && <span className="text-xs text-on-surface-variant">{address}</span>}
      {ratingCount !== undefined && <RatingStars avg={ratingAvg ?? 0} count={ratingCount} />}
      {multi && (
        <div className="flex flex-wrap gap-1">
          {sports!.map((key) => {
            const sport = getSport(key);
            if (!sport) return null;
            return (
              <span
                key={key}
                className="flex items-center gap-1 rounded-full bg-surface-variant px-1.5 py-0.5 text-[11px] text-on-surface-variant"
              >
                <SportIcon sport={key} size={11} />
                {sport.label}
              </span>
            );
          })}
        </div>
      )}
      {href && (
        <Link
          href={href}
          className="court-popup-cta mt-1 self-center rounded-full bg-primary-lime px-3 py-1.5 text-xs font-bold hover:opacity-90"
        >
          Ver ubicación →
        </Link>
      )}
    </div>
  );
}
