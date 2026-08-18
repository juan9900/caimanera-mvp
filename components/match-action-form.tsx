"use client";

import { useState, useTransition } from "react";
import type { MatchActionResult } from "@/app/actions/matches";

export function MatchActionForm({
  action,
  hiddenFields,
  label,
  pendingLabel,
  className,
}: {
  action: (formData: FormData) => Promise<MatchActionResult>;
  hiddenFields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await action(formData);
            if (result?.message) setError(result.message);
          });
        }}
      >
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button type="submit" disabled={isPending} className={className}>
          {isPending ? (pendingLabel ?? label) : label}
        </button>
      </form>
      {error && <p className="mt-1 font-body text-xs text-dark-error">{error}</p>}
    </div>
  );
}
