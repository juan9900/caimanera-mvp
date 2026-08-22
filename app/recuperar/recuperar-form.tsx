"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";

export function RecuperarForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-lime/15">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-primary-lime"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16v12H4z" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold">Revisa tu email</h2>
        <p className="font-body text-sm text-on-surface-variant">{state.message}</p>
        <p className="font-body text-sm text-on-surface-variant">
          Si no lo ves, revisa también la carpeta de spam.
        </p>
        <p className="font-body text-sm text-on-surface-variant">
          <Link href="/login" className="text-primary-lime underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="email" className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="mt-1 w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface focus:border-primary-lime focus:outline-none"
        />
        {state?.errors?.email && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.email[0]}</p>
        )}
      </div>

      {state?.message && <p className="font-body text-sm text-dark-error">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar enlace"}
      </button>

      <p className="text-center font-body text-sm text-on-surface-variant">
        <Link href="/login" className="text-primary-lime underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
