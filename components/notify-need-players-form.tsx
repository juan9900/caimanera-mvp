"use client";

import { useState, useTransition } from "react";
import { notifyNeedPlayers } from "@/app/actions/matches";

const SCOPE_OPTIONS = [
  { value: "red", label: "Mi red" },
  { value: "amigos", label: "Amigos de amigos" },
  { value: "canchas", label: "Mis canchas" },
] as const;

export function NotifyNeedPlayersForm({ matchId }: { matchId: string }) {
  const [scope, setScope] = useState<string>("red");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ message: string; ok: boolean } | null>(null);

  return (
    <div className="rounded-xl border border-surface-variant/50 bg-surface-container p-4">
      <p className="font-body text-sm font-medium text-on-surface">¿Te falta gente?</p>
      <form
        className="mt-2 flex flex-wrap items-center gap-3"
        action={(formData) => {
          setResult(null);
          startTransition(async () => {
            const res = await notifyNeedPlayers(formData);
            setResult(res);
          });
        }}
      >
        <input type="hidden" name="matchId" value={matchId} />
        <fieldset className="flex flex-wrap gap-3">
          {SCOPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 font-body text-sm text-on-surface">
              <input
                type="radio"
                name="scope"
                value={opt.value}
                checked={scope === opt.value}
                onChange={() => setScope(opt.value)}
                className="accent-primary-lime"
              />
              {opt.label}
            </label>
          ))}
        </fieldset>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary disabled:opacity-50"
        >
          {isPending ? "Avisando…" : "Necesito más gente"}
        </button>
      </form>
      {result && (
        <p className={`mt-2 font-body text-xs ${result.ok ? "text-primary-lime" : "text-dark-error"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
