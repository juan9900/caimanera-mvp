"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  // Controlled (not defaultValue) so a failed submit — e.g. invalid password —
  // doesn't wipe the email the user already typed: React resets uncontrolled
  // form fields after a form action runs, but leaves controlled ones alone.
  const [email, setEmail] = useState("");

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
          ¿Ya confirmaste?{" "}
          <Link href="/login" className="text-primary-lime underline">
            Inicia sesión
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

      {state?.message && <p className="font-body text-sm text-dark-error">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center font-body text-sm text-on-surface-variant">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary-lime underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
