"use client";

import { SegmentedControl } from "@/components/segmented-control";
import type { MatchVisibility } from "@/lib/matches/definitions";

const VISIBILITY_OPTIONS = [
  { value: "publica", label: "Pública" },
  { value: "amigos", label: "Amigos" },
  { value: "privada", label: "Privada" },
] as const;

const VISIBILITY_HELP: Record<MatchVisibility, string> = {
  publica:
    "Aparece en el inicio y en Partidos — cualquiera puede solicitar unirse e igual debes aprobar cada solicitud.",
  amigos:
    "Solo tus amigos la ven, en su inicio — no aparece en Partidos ni para desconocidos. Igual debes aprobar cada solicitud.",
  privada:
    "No aparece en ningún lado, ni siquiera para tus amigos — solo entra quien reciba el link o una invitación.",
};

/**
 * Segmented slide control for a match's `visibility` level. Purely
 * presentational — callers own the state and decide what happens on change
 * (local state on create, an immediate Server Action call on an existing
 * match). `disabled` is used to show a read-only state to non-organizers.
 */
export function VisibilityToggle({
  value,
  onChange,
  disabled,
}: {
  value: MatchVisibility;
  onChange: (value: MatchVisibility) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <SegmentedControl options={VISIBILITY_OPTIONS} value={value} onChange={onChange} disabled={disabled} />
      <p className="mt-2 min-h-8 font-body text-xs text-on-surface-variant">
        {VISIBILITY_HELP[value]}
      </p>
    </div>
  );
}
