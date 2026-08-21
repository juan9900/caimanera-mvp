"use client";

/**
 * App-wide pill selector with a sliding highlight behind equal-width
 * options — the standard look for any binary/multi-way picker (visibility,
 * tabs, filters). Purely presentational: callers own the selected value.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <div
      className={`rounded-full border border-surface-variant bg-surface-container p-1 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="relative flex">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 rounded-full bg-primary-lime transition-transform duration-200 ease-out"
          style={{
            width: `${100 / options.length}%`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`relative z-10 flex-1 rounded-full py-2 font-label text-xs font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed ${
              option.value === value ? "text-on-primary" : "text-on-surface-variant"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
