"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSidebarToggle } from "@/components/admin/admin-sidebar";
import { logout } from "@/app/actions/auth";

const SECTION_TITLES: { prefix: string; label: string }[] = [
  { prefix: "/admin/canchas", label: "Canchas" },
  { prefix: "/admin/usuarios", label: "Usuarios" },
  { prefix: "/admin/partidos", label: "Partidos" },
  { prefix: "/admin/sugerencias", label: "Lugares pendientes" },
];

function sectionTitle(pathname: string): string {
  const match = SECTION_TITLES.find((s) => pathname.startsWith(s.prefix));
  return match?.label ?? "Resumen";
}

export function AdminTopbar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <AdminSidebarToggle />
        <h1 className="text-sm font-medium text-zinc-700">{sectionTitle(pathname)}</h1>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/" className="text-zinc-500 hover:text-zinc-800">
          Ver el sitio →
        </Link>
        <span className="hidden text-zinc-400 sm:inline">·</span>
        <span className="hidden text-zinc-700 sm:inline">{userName}</span>
        <form action={logout}>
          <button type="submit" className="text-zinc-500 hover:text-zinc-800">
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
