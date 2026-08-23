"use client";

import { useState, useTransition } from "react";
import { reportPayment } from "@/app/actions/payments";

/**
 * Confirmed non-organizer player: notifies their Pago Móvil reference to the
 * organizer. Nunca hay transacciones dentro de la app — solo deja constancia
 * de la referencia para que el organizador la verifique por fuera.
 */
export function ReportPaymentButton({ matchId }: { matchId: string }) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary"
      >
        Notificar pago
      </button>
    );
  }

  return (
    <form
      action={() => {
        setError(null);
        startTransition(async () => {
          const formData = new FormData();
          formData.set("matchId", matchId);
          formData.set("reference", reference);
          const result = await reportPayment(formData);
          if (result?.message) {
            setError(result.message);
            return;
          }
          setOpen(false);
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Número de referencia"
        maxLength={40}
        className="min-w-0 flex-1 rounded-lg border border-surface-variant bg-surface-container px-3 py-1.5 font-body text-sm text-on-surface focus:border-primary-lime focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending || reference.trim().length === 0}
        className="rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary disabled:opacity-50"
      >
        {isPending ? "Enviando…" : "Enviar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="font-label text-xs font-bold text-on-surface-variant"
      >
        Cancelar
      </button>
      {error && <p className="w-full font-body text-xs text-dark-error">{error}</p>}
    </form>
  );
}
