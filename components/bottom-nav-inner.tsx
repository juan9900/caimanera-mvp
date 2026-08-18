"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Goal, MapPin, User, Plus } from "lucide-react";

const LEFT_TABS = [
  { href: "/", label: "Explorar", Icon: Compass },
  { href: "/partidos", label: "Partidos", Icon: Goal },
] as const;

const RIGHT_TABS = [
  { href: "/canchas", label: "Canchas", Icon: MapPin },
  { href: "/perfil", label: "Perfil", Icon: User },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavTab({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof Compass;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-16 flex-col items-center gap-1 whitespace-nowrap transition-transform active:scale-95 ${
        active ? "text-primary-lime" : "text-on-surface-variant"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden size={22} strokeWidth={active ? 2.25 : 1.75} />
      <span className={`font-label text-[10px] ${active ? "font-semibold" : ""}`}>{label}</span>
    </Link>
  );
}

/**
 * App-style floating bottom tab bar with a central FAB that creates a match.
 * Active tab is derived from the current pathname.
 */
export function BottomNavInner() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-outline-variant/50 bg-surface-container/90 pb-safe backdrop-blur-xl">
      <div className="relative flex h-20 items-center justify-between px-4">
        {LEFT_TABS.map(({ href, label, Icon }) => (
          <NavTab key={href} href={href} label={label} Icon={Icon} active={isActive(pathname, href)} />
        ))}

        <div className="-mt-10 px-2">
          <Link
            href="/partidos/nuevo"
            aria-label="Crear partido"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-lime text-on-primary shadow-[0_8px_24px_rgba(195,244,0,0.4)] transition-transform active:scale-90"
          >
            <Plus aria-hidden size={32} strokeWidth={2.25} />
          </Link>
        </div>

        {RIGHT_TABS.map(({ href, label, Icon }) => (
          <NavTab key={href} href={href} label={label} Icon={Icon} active={isActive(pathname, href)} />
        ))}
      </div>
    </nav>
  );
}
