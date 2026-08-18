"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

export function SignupForm({ defaultInviteCode }: { defaultInviteCode?: string }) {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="inviteCode" className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Código de invitación
        </label>
        <input
          id="inviteCode"
          name="inviteCode"
          defaultValue={defaultInviteCode}
          placeholder="Ej: a1b2c3d4"
          className="mt-1 w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-lime focus:outline-none"
        />
        {state?.errors?.inviteCode && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.inviteCode[0]}</p>
        )}
      </div>

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
        className="w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)] disabled:opacity-50"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center font-body text-sm text-on-surface-variant">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-primary-lime underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
