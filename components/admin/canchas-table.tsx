"use client";

import Link from "next/link";
import { PLANS, subscriptionState } from "@/lib/billing/plans";
import { Badge, type BadgeTone } from "@/components/admin/ui/badge";
import { SearchableTable } from "@/components/admin/ui/searchable-table";
import type { DataTableColumn } from "@/components/admin/ui/data-table";
import type { getAllCourts } from "@/lib/auth/dal";

type CourtRow = Awaited<ReturnType<typeof getAllCourts>>[number];

const PLAN_TONE: Record<ReturnType<typeof subscriptionState>, BadgeTone> = {
  activa: "green",
  en_gracia: "amber",
  vencida: "red",
  cancelada: "zinc",
};

const PLAN_STATE_LABEL: Record<ReturnType<typeof subscriptionState>, string> = {
  activa: "",
  en_gracia: " (en gracia)",
  vencida: " (vencido)",
  cancelada: " (cancelado)",
};

const COLUMNS: DataTableColumn<CourtRow>[] = [
  {
    key: "name",
    header: "Nombre",
    render: (court) => (
      <Link href={`/canchas/${court.id}`} className="font-medium text-zinc-900 hover:underline">
        {court.name}
      </Link>
    ),
  },
  {
    key: "plan",
    header: "Plan",
    render: (court) => {
      const sub = court.subscription;
      const state = sub ? subscriptionState(sub) : null;
      if (!sub || !state) return <span className="text-zinc-400">Sin plan</span>;
      return (
        <Badge tone={PLAN_TONE[state]}>
          {PLANS[sub.plan].label}
          {PLAN_STATE_LABEL[state]}
        </Badge>
      );
    },
  },
  {
    key: "expires",
    header: "Vence",
    render: (court) =>
      court.subscription
        ? new Date(court.subscription.current_period_end).toLocaleDateString("es-VE", {
            dateStyle: "medium",
          })
        : "—",
  },
  {
    key: "public",
    header: "Pública",
    render: (court) => (court.is_public ? <Badge tone="lime">Lugar público</Badge> : "—"),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: (court) => (
      <Link href={`/admin/canchas/${court.id}/editar`} className="text-xs font-medium text-green-700 hover:underline">
        Editar
      </Link>
    ),
  },
];

export function CanchasTable({ courts }: { courts: CourtRow[] }) {
  return (
    <SearchableTable
      columns={COLUMNS}
      rows={courts}
      getRowKey={(court) => court.id}
      getSearchText={(court) => court.name}
      placeholder="Buscar cancha por nombre..."
      empty="Todavía no hay canchas cargadas."
    />
  );
}
