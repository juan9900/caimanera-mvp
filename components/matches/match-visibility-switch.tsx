"use client";

import { useState, useTransition } from "react";
import { setMatchVisibility } from "@/app/actions/matches";
import { VisibilityToggle } from "@/components/matches/visibility-toggle";

/**
 * Wraps `VisibilityToggle` for an existing match: everyone sees it (per
 * product decision — it's informative at a glance), but only the organizer
 * can flip it. Flipping calls `setMatchVisibility` immediately and reverts
 * the optimistic update if the action fails.
 */
export function MatchVisibilitySwitch({
  matchId,
  initialIsPublic,
  editable,
}: {
  matchId: string;
  initialIsPublic: boolean;
  editable: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: boolean) {
    if (next === isPublic) return;
    setError(null);
    setIsPublic(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("matchId", matchId);
      formData.set("isPublic", next ? "true" : "false");
      const result = await setMatchVisibility(formData);
      if (result?.message) {
        setIsPublic(!next);
        setError(result.message);
      }
    });
  }

  return (
    <div>
      <VisibilityToggle value={isPublic} onChange={handleChange} disabled={!editable || isPending} />
      {error && <p className="mt-1 font-body text-xs text-dark-error">{error}</p>}
    </div>
  );
}
