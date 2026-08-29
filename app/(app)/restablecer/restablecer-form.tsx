"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";

export function RestablecerForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="password" className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="mt-1 w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface focus:border-primary-lime focus:outline-none"
        />
        {state?.errors?.password && (
          <div className="mt-1 font-body text-sm text-dark-error">
            <p>La contraseña debe:</p>
            <ul className="list-disc pl-5">
              {state.errors.password.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className="mt-1 w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface focus:border-primary-lime focus:outline-none"
        />
        {state?.errors?.confirmPassword && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      {state?.message && <p className="font-body text-sm text-dark-error">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
