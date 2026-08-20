/**
 * Renders a small set of lucide-style icon "nodes" (the same
 * `[tag, attrs][]` shape lucide-react icons are built from) into a raw SVG
 * markup string. Needed because Leaflet's `L.divIcon` takes an HTML string,
 * not a React element, so map pins can't render `lucide-react` components
 * directly — this keeps the pin glyphs visually consistent with the lucide
 * icons used elsewhere (checkboxes, chips) without duplicating artwork.
 */
export type IconNode = [tag: string, attrs: Record<string, string>][];

/**
 * A sport glyph is either hand-drawn as stroke `IconNode`s (24x24, matches
 * the lucide-react convention used elsewhere in the app) or a filled
 * silhouette lifted from an external SVG asset (own `viewBox`, raw inner
 * markup with any hardcoded fill stripped so `currentColor` cascades in).
 */
export type IconSource =
  | { kind: "stroke"; nodes: IconNode; strokeWidth?: number }
  | { kind: "fill"; viewBox: string; markup: string };

export function renderIconSvg(
  nodes: IconNode,
  { size = 16, color = "currentColor", strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number } = {},
): string {
  const children = nodes
    .map(([tag, attrs]) => {
      const attrString = Object.entries(attrs)
        .filter(([key]) => key !== "key")
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");
      return `<${tag} ${attrString}></${tag}>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

/** Same output contract as `renderIconSvg`, but dispatches on `IconSource["kind"]`. */
export function renderIconSource(
  source: IconSource,
  opts: { size?: number; color?: string; strokeWidth?: number } = {},
): string {
  if (source.kind === "stroke") {
    return renderIconSvg(source.nodes, { strokeWidth: source.strokeWidth, ...opts });
  }
  const { size = 16, color = "currentColor" } = opts;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${source.viewBox}" fill="${color}">${source.markup}</svg>`;
}
