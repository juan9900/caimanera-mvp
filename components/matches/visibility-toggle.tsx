"use client";

/**
 * Segmented slide control for a match's `is_public` flag. Purely
 * presentational — callers own the state and decide what happens on change
 * (local state on create, an immediate Server Action call on an existing
 * match). `disabled` is used to show a read-only state to non-organizers.
 */
export function VisibilityToggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div
        className={`relative flex rounded-full border border-surface-variant bg-surface-container p-1 ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <div
          aria-hidden="true"
          className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary-lime transition-transform duration-200 ease-out ${
            value ? "translate-x-0" : "translate-x-full"
          }`}
        />
        <button
          type="button"
          onClick={() => onChange(true)}
          disabled={disabled}
          className={`relative z-10 flex-1 rounded-full py-2 font-label text-xs font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed ${
            value ? "text-on-primary" : "text-on-surface-variant"
          }`}
        >
          Pública
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          disabled={disabled}
          className={`relative z-10 flex-1 rounded-full py-2 font-label text-xs font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed ${
            !value ? "text-on-primary" : "text-on-surface-variant"
          }`}
        >
          Privada
        </button>
      </div>
      <p className="mt-2 min-h-8 font-body text-xs text-on-surface-variant">
        {value
          ? "Cualquiera puede verla en el inicio y en Partidos y solicitar unirse — igual debes aprobar cada solicitud."
          : "No aparece en el inicio ni en Partidos, solo entra quien tenga el link — igual debes aprobar cada solicitud."}
      </p>
    </div>
  );
}
