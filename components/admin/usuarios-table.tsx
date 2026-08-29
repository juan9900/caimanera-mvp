"use client";

import { Badge } from "@/components/admin/ui/badge";
import { SearchableTable } from "@/components/admin/ui/searchable-table";
import type { DataTableColumn } from "@/components/admin/ui/data-table";
import type { getAllUsers } from "@/lib/auth/dal";

type UserRow = Awaited<ReturnType<typeof getAllUsers>>[number];

const COLUMNS: DataTableColumn<UserRow>[] = [
  {
    key: "name",
    header: "Usuario",
    render: (user) => (
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
          {(user.name ?? "?").trim()[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="font-medium text-zinc-900">{user.name ?? "Jugador"}</span>
      </div>
    ),
  },
  {
    key: "role",
    header: "Rol",
    render: (user) => (user.is_admin ? <Badge tone="green">Admin</Badge> : "—"),
  },
  {
    key: "created_at",
    header: "Alta",
    render: (user) =>
      new Date(user.created_at).toLocaleDateString("es-VE", { dateStyle: "medium" }),
  },
];

export function UsuariosTable({ users }: { users: UserRow[] }) {
  return (
    <SearchableTable
      columns={COLUMNS}
      rows={users}
      getRowKey={(user) => user.id}
      getSearchText={(user) => user.name ?? ""}
      placeholder="Buscar usuario por nombre..."
      empty="Todavía no hay usuarios registrados."
    />
  );
}
