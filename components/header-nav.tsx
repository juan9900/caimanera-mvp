"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const REALTIME_REFRESH_DEBOUNCE_MS = 800;

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-lime px-1 font-label text-[10px] font-bold text-on-primary">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function HeaderNav({
  authed,
  userLabel,
  isAdmin,
  invitationCount = 0,
  friendRequestCount = 0,
  logout,
}: {
  authed: boolean;
  userLabel?: string;
  isAdmin?: boolean;
  invitationCount?: number;
  friendRequestCount?: number;
  logout?: (formData: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const totalCount = invitationCount + friendRequestCount;

  const links = [
    { href: "/canchas", label: "Canchas", count: 0 },
    { href: "/partidos", label: "Partidos", count: 0 },
    { href: "/invitaciones", label: "Invitaciones", count: invitationCount },
    { href: "/red", label: "Mi red", count: friendRequestCount },
    { href: "/perfil", label: "Perfil", count: 0 },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", count: 0 }] : []),
  ];

  const mobileLinks = [
    { href: "/", label: "Explorar", count: 0 },
    { href: "/partidos", label: "Partidos", count: 0 },
    { href: "/canchas", label: "Canchas", count: 0 },
    { href: "/red", label: "Mi red", count: friendRequestCount },
    { href: "/invitaciones", label: "Invitaciones", count: invitationCount },
    { href: "/perfil", label: "Perfil", count: 0 },
  ];

  // Realtime: refresh so the invitation/friend-request badges stay accurate.
  useEffect(() => {
    if (!authed) return;

    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => router.refresh(), REALTIME_REFRESH_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel("header-nav-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "match_participants" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, scheduleRefresh)
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [authed, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-xl text-on-surface md:hidden"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
        {!open && totalCount > 0 && (
          <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-lime px-1 font-label text-[10px] font-bold text-on-primary">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      <nav className="hidden items-center gap-4 text-sm md:flex">
        {authed ? (
          <>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center text-on-surface-variant hover:text-primary-lime"
              >
                {link.label}
                <NavBadge count={link.count} />
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
        <nav className="absolute left-0 right-0 top-full z-50 flex flex-col gap-1 border-b border-outline-variant bg-surface px-6 py-3 text-sm md:hidden">
          {authed ? (
            <>
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center py-1.5 text-on-surface-variant hover:text-primary-lime"
                >
                  {link.label}
                  <NavBadge count={link.count} />
                </Link>
              ))}
              <form action={logout}>
                <button type="submit" className="py-1.5 text-left text-on-surface-variant hover:text-primary-lime">
                  Cerrar sesión
                </button>
              </form>
              <span className="pt-1 text-right font-body text-xs text-on-surface-variant/60">
                {userLabel}
              </span>
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
