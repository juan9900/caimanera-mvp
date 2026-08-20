"use client";

import { TileLayer } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { getSport, SportIcon } from "@/lib/courts/sports";
import { renderIconSvg, renderIconSource } from "@/lib/icons/svg-icon";

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

// Lucide `Layers` glyph used when a court offers more than one sport (e.g. a
// multi-cancha complex), so it reads visually as "several things here"
// instead of the "no sport data" pin above.
const MULTI_SPORT_PIN_NODE = renderIconSvg(
  [
    [
      "path",
      {
        d: "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",
      },
    ],
    ["path", { d: "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" }],
    ["path", { d: "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" }],
  ],
  { size: 14, color: "#c3f400" },
);

const iconCache = new Map<string, L.DivIcon>();

/**
 * Round dark pin with a lime glyph inside: the sport's icon when a court
 * offers exactly one, a stacked "layers" glyph when it offers several (a
 * multi-cancha complex), otherwise a generic location pin. Used by every
 * court marker in the app (display maps, picker, home card, `/mapa`).
 */
export function buildCourtIcon(sports: string[] | null | undefined, opts: { selected?: boolean } = {}): L.DivIcon {
  const key = `${(sports ?? []).join(",")}|${opts.selected ? "sel" : ""}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const count = sports?.length ?? 0;
  const single = count === 1 ? getSport(sports![0]) : undefined;
  const glyph = single
    ? renderIconSource(single.icon, { size: 14, color: "#c3f400" })
    : count > 1
      ? MULTI_SPORT_PIN_NODE
      : GENERIC_PIN_NODE;

  const size = opts.selected ? 40 : 32;

  const icon = L.divIcon({
    className: "",
    html: `<span class="flex items-center justify-center rounded-full bg-surface-container ${
      opts.selected ? "border-2 border-primary-lime shadow-[0_0_0_4px_rgba(195,244,0,0.25)]" : "border border-primary-lime/70"
    } shadow-md" style="width:${size}px;height:${size}px">${glyph}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

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
}: {
  name: string;
  address?: string | null;
  sports?: string[] | null;
  href?: string;
}) {
  const multi = sports && sports.length > 1;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-semibold text-on-surface">{name}</span>
      {address && <span className="text-xs text-on-surface-variant">{address}</span>}
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
