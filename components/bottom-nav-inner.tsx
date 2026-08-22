"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Compass, Goal, Mail, MapPin, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const REALTIME_REFRESH_DEBOUNCE_MS = 800;

const LEFT_TABS = [
  { href: "/", label: "Inicio", Icon: Compass, dataTour: undefined },
  { href: "/partidos", label: "Partidos", Icon: Goal, dataTour: "partidos" },
] as const;

const RIGHT_TABS = [
  { href: "/canchas", label: "Canchas", Icon: MapPin, dataTour: "canchas" },
  { href: "/invitaciones", label: "Invitaciones", Icon: Mail, dataTour: "invitaciones" },
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
  badgeCount,
  dataTour,
}: {
  href: string;
  label: string;
  Icon: typeof Compass;
  active: boolean;
  badgeCount?: number;
  dataTour?: string;
}) {
  return (
    <Link
      href={href}
      data-tour={dataTour}
      className={`flex w-16 flex-col items-center gap-1 whitespace-nowrap transition-transform active:scale-95 ${
        active ? "text-primary-lime" : "text-on-surface-variant"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative">
        <Icon aria-hidden size={22} strokeWidth={active ? 2.25 : 1.75} />
        {!!badgeCount && badgeCount > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-lime px-1 font-label text-[10px] font-bold text-on-primary">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </span>
      <span className={`font-label text-[10px] ${active ? "font-semibold" : ""}`}>{label}</span>
    </Link>
  );
}

/**
 * App-style floating bottom tab bar with a central FAB that creates a match.
 * Active tab is derived from the current pathname. Primary navigation for
 * every screen size (see `components/header-nav.tsx` for the secondary
 * Social/Account menus in the header).
 */
export function BottomNavInner({ invitationCount }: { invitationCount: number }) {
  const pathname = usePathname();
  const router = useRouter();

  // Realtime: refresh so the Invitaciones badge stays accurate without a full reload.
  useEffect(() => {
    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => router.refresh(), REALTIME_REFRESH_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel("bottom-nav-invitations")
      .on("postgres_changes", { event: "*", schema: "public", table: "match_participants" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, scheduleRefresh)
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-outline-variant/50 bg-surface-container/90 pb-safe backdrop-blur-xl">
      <div className="relative flex h-20 items-center justify-between px-4">
        {LEFT_TABS.map(({ href, label, Icon, dataTour }) => (
          <NavTab
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={isActive(pathname, href)}
            dataTour={dataTour}
          />
        ))}

        <div className="-mt-10 px-2">
          <Link
            href="/partidos/nuevo"
            aria-label="Crear partido"
            data-tour="crear"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-lime text-on-primary shadow-md transition-transform active:scale-90"
          >
            <Plus aria-hidden size={32} strokeWidth={2.25} />
          </Link>
        </div>

        {RIGHT_TABS.map(({ href, label, Icon, dataTour }) => (
          <NavTab
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={isActive(pathname, href)}
            badgeCount={href === "/invitaciones" ? invitationCount : undefined}
            dataTour={dataTour}
          />
        ))}
      </div>
    </nav>
  );
}
