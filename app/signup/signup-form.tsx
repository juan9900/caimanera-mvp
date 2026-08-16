"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

export function SignupForm({ defaultInviteCode }: { defaultInviteCode?: string }) {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="inviteCode" className="block text-sm font-medium text-zinc-700">
          Código de invitación
        </label>
        <input
          id="inviteCode"
          name="inviteCode"
          defaultValue={defaultInviteCode}
          placeholder="Ej: a1b2c3d4"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {state?.errors?.inviteCode && (
          <p className="mt-1 text-sm text-red-600">{state.errors.inviteCode[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {state?.errors?.email && (
          <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {state?.errors?.password && (
          <div className="mt-1 text-sm text-red-600">
            <p>La contraseña debe:</p>
            <ul className="list-disc pl-5">
              {state.errors.password.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-green-700 underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
