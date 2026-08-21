"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, User as UserIcon, Users } from "lucide-react";
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

/** Closes `menu` when a click lands outside `ref`. */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, open, close]);
}

function SocialMenu({ friendRequestCount }: { friendRequestCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center text-on-surface-variant hover:text-primary-lime"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Users aria-hidden size={20} />
        <span className="ml-1.5 hidden md:inline">Social</span>
        <NavBadge count={friendRequestCount} />
        <ChevronDown aria-hidden size={14} className="ml-0.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-outline-variant/50 bg-surface-container p-1.5 shadow-xl">
          <Link
            href="/red"
            onClick={() => setOpen(false)}
            className="flex items-center rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-variant/50"
          >
            Mi red
            <NavBadge count={friendRequestCount} />
          </Link>
          <Link
            href="/grupos"
            onClick={() => setOpen(false)}
            className="flex items-center rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-variant/50"
          >
            Grupos
          </Link>
        </div>
      )}
    </div>
  );
}

function AccountMenu({
  userLabel,
  isAdmin,
  logout,
}: {
  userLabel?: string;
  isAdmin?: boolean;
  logout?: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));

  const initial = userLabel?.trim()?.[0]?.toUpperCase() ?? null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-variant text-on-surface-variant hover:text-primary-lime"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Cuenta"
      >
        {initial ? (
          <span className="font-label text-xs font-bold">{initial}</span>
        ) : (
          <UserIcon aria-hidden size={16} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-outline-variant/50 bg-surface-container p-1.5 shadow-xl">
          {userLabel && (
            <p className="truncate px-3 pb-1.5 pt-1 font-body text-xs text-on-surface-variant/60">{userLabel}</p>
          )}
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-variant/50"
          >
            Perfil
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-variant/50"
            >
              Admin
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-variant/50"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * Secondary header navigation — same on every screen size, and deliberately
 * does NOT duplicate the primary bottom tab bar (`components/bottom-nav-inner.tsx`,
 * which owns Inicio/Partidos/Crear/Canchas/Invitaciones). Only two entry
 * points live here: "Social" (Mi red + Grupos) and the account menu
 * (Perfil/Admin/Cerrar sesión).
 */
export function HeaderNav({
  authed,
  userLabel,
  isAdmin,
  friendRequestCount = 0,
  logout,
}: {
  authed: boolean;
  userLabel?: string;
  isAdmin?: boolean;
  friendRequestCount?: number;
  logout?: (formData: FormData) => void | Promise<void>;
}) {
  const router = useRouter();

  // Realtime: refresh so the Social badge (friend requests) stays accurate.
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
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, scheduleRefresh)
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [authed, router]);

  if (!authed) {
    return (
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/login" className="text-on-surface-variant hover:text-primary-lime">
          Iniciar sesión
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-primary-lime px-3 py-1.5 font-medium text-on-primary hover:brightness-95"
        >
          Crear cuenta
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3 text-sm">
      <SocialMenu friendRequestCount={friendRequestCount} />
      <AccountMenu userLabel={userLabel} isAdmin={isAdmin} logout={logout} />
    </nav>
  );
}
