"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface px-6 py-12 text-center text-on-surface">
      <h1 className="font-display text-xl font-bold">Algo salió mal</h1>
      <p className="font-body text-sm text-on-surface-variant">No pudimos cargar esta página. Intenta de nuevo.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)]"
      >
        Reintentar
      </button>
    </div>
  );
}
