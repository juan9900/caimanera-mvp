import { getAmenity } from "@/lib/courts/amenities";

/**
 * Premium grid presentation of a court's amenities — the "worth paying for"
 * showcase on official courts' detail pages. Unlike the compact `AmenityIcons`
 * chips used on cards/lists, each amenity here gets its own tile with a lime
 * icon badge so the section reads as a highlight, not an afterthought. Unknown/
 * stale keys are skipped, same as `AmenityIcons`.
 */
export function AmenitiesShowcase({ amenities }: { amenities: string[] | null | undefined }) {
  const known = (amenities ?? []).map(getAmenity).filter((a) => a !== undefined);
  if (known.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {known.map(({ key, label, Icon }) => (
        <div
          key={key}
          className="flex items-center gap-2 rounded-xl border border-surface-variant/50 bg-surface-container px-3 py-2.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container/30">
            <Icon className="h-4 w-4 text-primary-lime" aria-hidden="true" />
          </span>
          <span className="font-body text-sm text-on-surface">{label}</span>
        </div>
      ))}
    </div>
  );
}
