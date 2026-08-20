"use client";

import { useActionState } from "react";
import { createGroup } from "@/app/actions/groups";

export function CreateGroupForm() {
  const [state, action, pending] = useActionState(createGroup, undefined);

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <input
          name="name"
          placeholder="Nombre del grupo (ej: Los del martes)"
          className="w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface placeholder:text-on-surface-variant focus:border-primary-lime focus:outline-none"
        />
        {state?.errors?.name && (
          <p className="mt-1 font-body text-xs text-dark-error">{state.errors.name[0]}</p>
        )}
        {state?.message && (
          <p className="mt-1 font-body text-xs text-dark-error">{state.message}</p>
        )}
      </div>
      <button
        disabled={pending}
        type="submit"
        className="shrink-0 rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear grupo"}
      </button>
    </form>
  );
}
