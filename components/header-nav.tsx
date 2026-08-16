"use client";

import { useState } from "react";
import Link from "next/link";

const AUTHED_LINKS = [
  { href: "/canchas", label: "Canchas" },
  { href: "/partidos", label: "Partidos" },
  { href: "/red", label: "Mi red" },
  { href: "/perfil", label: "Perfil" },
];

export function HeaderNav({
  authed,
  userLabel,
  isAdmin,
  logout,
}: {
  authed: boolean;
  userLabel?: string;
  isAdmin?: boolean;
  logout?: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const links = isAdmin ? [...AUTHED_LINKS, { href: "/admin", label: "Admin" }] : AUTHED_LINKS;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xl text-zinc-700 md:hidden"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
      </button>

      <nav className="hidden items-center gap-4 text-sm md:flex">
        {authed ? (
          <>
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-zinc-700 hover:text-green-700">
                {link.label}
              </Link>
            ))}
            <span className="text-zinc-500">{userLabel}</span>
            <form action={logout}>
              <button type="submit" className="text-zinc-700 hover:text-green-700">
                Cerrar sesión
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-zinc-700 hover:text-green-700">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-green-600 px-3 py-1.5 font-medium text-white hover:bg-green-700"
            >
              Crear cuenta
            </Link>
          </>
        )}
      </nav>

      {open && (
        <nav className="absolute left-0 right-0 top-full z-10 flex flex-col gap-1 border-b border-zinc-200 bg-white px-6 py-3 text-sm md:hidden">
          {authed ? (
            <>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-1.5 text-zinc-700 hover:text-green-700"
                >
                  {link.label}
                </Link>
              ))}
              <span className="py-1.5 text-zinc-500">{userLabel}</span>
              <form action={logout}>
                <button type="submit" className="py-1.5 text-left text-zinc-700 hover:text-green-700">
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="py-1.5 text-zinc-700 hover:text-green-700"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="py-1.5 font-medium text-green-700"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      )}
    </>
  );
}
