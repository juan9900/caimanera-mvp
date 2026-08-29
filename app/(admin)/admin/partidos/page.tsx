import Link from "next/link";
import { getAllMatches } from "@/lib/auth/dal";
import { SPORT_LABELS } from "@/lib/matches/home";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Badge, type BadgeTone } from "@/components/admin/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";

type MatchRow = Awaited<ReturnType<typeof getAllMatches>>[number];

const STATUS_LABELS: Record<string, string> = {
  abierto: "Abierto",
  completo: "Completo",
  cancelado: "Cancelado",
  vencido: "Vencido",
};

const STATUS_TONE: Record<string, BadgeTone> = {
  abierto: "green",
  completo: "zinc",
  cancelado: "red",
  vencido: "red",
};

const COLUMNS: DataTableColumn<MatchRow>[] = [
  {
    key: "match",
    header: "Partido",
    render: (match) => (
      <Link href={`/partidos/${match.id}`} className="font-medium text-zinc-900 hover:underline">
        {match.court?.name ?? "Cancha"} · {SPORT_LABELS[match.sport] ?? match.sport}
      </Link>
    ),
  },
  {
    key: "datetime",
    header: "Fecha",
    render: (match) =>
      new Date(match.datetime).toLocaleString("es-VE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Caracas",
      }),
  },
  {
    key: "organizer",
    header: "Organizador",
    render: (match) => match.organizer?.name ?? "Alguien",
  },
  {
    key: "status",
    header: "Estado",
    render: (match) => <Badge tone={STATUS_TONE[match.status]}>{STATUS_LABELS[match.status]}</Badge>,
  },
];

export default async function AdminPartidosPage() {
  const matches = await getAllMatches();

  return (
    <div>
      <PageHeader title={`Partidos (${matches.length})`} />
      <DataTable
        columns={COLUMNS}
        rows={matches}
        getRowKey={(match) => match.id}
        empty="Todavía no hay partidos."
      />
    </div>
  );
}
