"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export function LoginForm({ next }: { next?: string } = {}) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="w-full max-w-sm space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
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

      <div>
        <label htmlFor="password" className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="mt-1 w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface focus:border-primary-lime focus:outline-none"
        />
        {state?.errors?.password && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && <p className="font-body text-sm text-dark-error">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-center font-body text-sm text-on-surface-variant">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-primary-lime underline">
          Regístrate con invitación
        </Link>
      </p>
    </form>
  );
}
