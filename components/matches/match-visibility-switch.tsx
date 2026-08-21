"use client";

import { useState, useTransition } from "react";
import { setMatchVisibility } from "@/app/actions/matches";
import { VisibilityToggle } from "@/components/matches/visibility-toggle";
import type { MatchVisibility } from "@/lib/matches/definitions";

/**
 * Wraps `VisibilityToggle` for an existing match: everyone sees it (per
 * product decision — it's informative at a glance), but only the organizer
 * can flip it. Flipping calls `setMatchVisibility` immediately and reverts
 * the optimistic update if the action fails.
 */
export function MatchVisibilitySwitch({
  matchId,
  initialVisibility,
  editable,
}: {
  matchId: string;
  initialVisibility: MatchVisibility;
  editable: boolean;
}) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: MatchVisibility) {
    if (next === visibility) return;
    setError(null);
    const previous = visibility;
    setVisibility(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("matchId", matchId);
      formData.set("visibility", next);
      const result = await setMatchVisibility(formData);
      if (result?.message) {
        setVisibility(previous);
        setError(result.message);
      }
    });
  }

  return (
    <div>
      <VisibilityToggle value={visibility} onChange={handleChange} disabled={!editable || isPending} />
      {error && <p className="mt-1 font-body text-xs text-dark-error">{error}</p>}
    </div>
  );
}
