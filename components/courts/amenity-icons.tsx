import { getAmenity } from "@/lib/courts/amenities";

/**
 * Renders a court's amenities as icons. `size="sm"` gives compact icon-only
 * chips (court cards, the create-match picker); `size="lg"` gives icon +
 * label rows (the court detail page). `tone="dark"` swaps the chip styling
 * for the dark home screen (see `FeaturedCourtsCarousel`); `tone="light"`
 * (default) keeps the original zinc styling used elsewhere. Unknown/stale
 * keys are skipped so removing an amenity from the catalog never breaks
 * rendering.
 */
export function AmenityIcons({
  amenities,
  size = "sm",
  tone = "light",
  className,
}: {
  amenities: string[] | null | undefined;
  size?: "sm" | "lg";
  tone?: "light" | "dark";
  className?: string;
}) {
  const known = (amenities ?? []).map(getAmenity).filter((a) => a !== undefined);
  if (known.length === 0) return null;

  if (size === "lg") {
    const textClassName = tone === "dark" ? "text-on-surface" : "text-zinc-700";
    const iconClassName = tone === "dark" ? "text-primary-lime" : "text-green-700";
    return (
      <ul className={`flex flex-wrap gap-x-4 gap-y-2 ${className ?? ""}`}>
        {known.map(({ key, label, Icon }) => (
          <li key={key} className={`flex items-center gap-1.5 font-body text-sm ${textClassName}`}>
            <Icon className={`h-4 w-4 ${iconClassName}`} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    );
  }

  const chipClassName =
    tone === "dark" ? "bg-surface-variant text-on-surface-variant" : "bg-zinc-100 text-zinc-600";

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {known.map(({ key, label, Icon }) => (
        <li
          key={key}
          title={label}
          className={`flex h-6 w-6 items-center justify-center rounded-full ${chipClassName}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </li>
      ))}
    </ul>
  );
}
