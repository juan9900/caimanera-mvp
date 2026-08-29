"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Users, Goal, BadgeCheck, Menu, X } from "lucide-react";
import { SiteLogo } from "@/components/site-logo";
import { useClickOutside } from "@/lib/hooks/use-click-outside";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/canchas", label: "Canchas", icon: MapPin },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/partidos", label: "Partidos", icon: Goal },
  { href: "/admin/sugerencias", label: "Lugares pendientes", icon: BadgeCheck },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, pendingCount, onNavigate }: { pathname: string; pendingCount: number; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
              active ? "bg-green-50 font-medium text-green-700" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Icon aria-hidden size={17} />
            <span className="flex-1">{label}</span>
            {href === "/admin/sugerencias" && pendingCount > 0 && (
              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Admin panel sidebar. Fixed on desktop (`lg:` and up); collapses to a slide-over
 * on smaller screens, opened from `AdminTopbar`'s hamburger via a shared open state
 * lifted into `data-admin-sidebar-toggle` (see `admin-topbar.tsx`).
 */
export function AdminSidebar({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useClickOutside(panelRef, mobileOpen, () => setMobileOpen(false));

  // Close the slide-over on navigation without an effect: reset the open state
  // during render when the pathname changes (see "Adjusting state" in React docs).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(() => {
    function handleToggle() {
      setMobileOpen((v) => !v);
    }
    window.addEventListener("admin-sidebar:toggle", handleToggle);
    return () => window.removeEventListener("admin-sidebar:toggle", handleToggle);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <Link href="/" className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
          <SiteLogo className="h-6 w-auto" />
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Admin</span>
        </Link>
        <div className="flex flex-1 flex-col py-3">
          <NavLinks pathname={pathname} pendingCount={pendingCount} />
        </div>
      </aside>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" aria-hidden />
          <div
            ref={panelRef}
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <SiteLogo className="h-6 w-auto" />
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Admin</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="text-zinc-500 hover:text-zinc-800"
              >
                <X aria-hidden size={20} />
              </button>
            </div>
            <div className="flex flex-1 flex-col py-3">
              <NavLinks pathname={pathname} pendingCount={pendingCount} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Hamburger trigger for the mobile sidebar, rendered from the topbar. */
export function AdminSidebarToggle() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("admin-sidebar:toggle"))}
      aria-label="Abrir menú"
      className="text-zinc-600 hover:text-zinc-900 lg:hidden"
    >
      <Menu aria-hidden size={20} />
    </button>
  );
}
