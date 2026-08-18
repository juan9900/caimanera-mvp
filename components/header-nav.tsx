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
        className="text-xl text-on-surface md:hidden"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
      </button>

      <nav className="hidden items-center gap-4 text-sm md:flex">
        {authed ? (
          <>
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-on-surface-variant hover:text-primary-lime">
                {link.label}
              </Link>
            ))}
            <span className="text-on-surface-variant">{userLabel}</span>
            <form action={logout}>
              <button type="submit" className="text-on-surface-variant hover:text-primary-lime">
                Cerrar sesión
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-on-surface-variant hover:text-primary-lime">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-primary-lime px-3 py-1.5 font-medium text-on-primary hover:brightness-95"
            >
              Crear cuenta
            </Link>
          </>
        )}
      </nav>

      {open && (
        <nav className="absolute left-0 right-0 top-full z-10 flex flex-col gap-1 border-b border-outline-variant bg-surface px-6 py-3 text-sm md:hidden">
          {authed ? (
            <>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-1.5 text-on-surface-variant hover:text-primary-lime"
                >
                  {link.label}
                </Link>
              ))}
              <span className="py-1.5 text-on-surface-variant">{userLabel}</span>
              <form action={logout}>
                <button type="submit" className="py-1.5 text-left text-on-surface-variant hover:text-primary-lime">
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="py-1.5 text-on-surface-variant hover:text-primary-lime"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="py-1.5 font-medium text-primary-lime"
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
