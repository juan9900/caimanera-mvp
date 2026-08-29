import { getPendingCourts } from "@/lib/auth/dal";
import { verifyCourt, deletePendingCourt } from "@/app/actions/courts";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Button } from "@/components/admin/ui/button";
import { ConfirmSubmit } from "@/components/admin/ui/confirm-submit";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";

type PendingCourtRow = Awaited<ReturnType<typeof getPendingCourts>>[number];

const COLUMNS: DataTableColumn<PendingCourtRow>[] = [
  {
    key: "name",
    header: "Lugar",
    render: (court) => (
      <div>
        <p className="font-medium text-zinc-900">{court.name}</p>
        {court.address && <p className="text-xs text-zinc-500">{court.address}</p>}
      </div>
    ),
  },
  {
    key: "coords",
    header: "Coordenadas",
    render: (court) => (
      <span className="font-mono text-xs text-zinc-500">
        {court.lat.toFixed(5)}, {court.lng.toFixed(5)}
      </span>
    ),
  },
  {
    key: "added_by",
    header: "Propuesto por",
    render: (court) => court.addedByUser?.name ?? "Alguien",
  },
  {
    key: "created_at",
    header: "Fecha",
    render: (court) =>
      new Date(court.created_at).toLocaleDateString("es-VE", { dateStyle: "medium" }),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: (court) => (
      <div className="flex justify-end gap-2">
        <form action={verifyCourt.bind(null, court.id)}>
          <Button type="submit" variant="primary" className="px-3 py-1.5 text-xs">
            Verificar
          </Button>
        </form>
        <form action={deletePendingCourt.bind(null, court.id)}>
          <ConfirmSubmit
            confirmMessage={`¿Eliminar "${court.name}"? Esta acción no se puede deshacer.`}
            className="px-3 py-1.5 text-xs"
          >
            Eliminar
          </ConfirmSubmit>
        </form>
      </div>
    ),
  },
];

export default async function AdminSugerenciasPage() {
  const pendingCourts = await getPendingCourts();

  return (
    <div>
      <PageHeader
        title={`Lugares pendientes de verificar (${pendingCourts.length})`}
        description="Lugares que agregaron usuarios desde el mapa o al crear un partido. Ya están activos para quien los agregó; verifica para que sean visibles para todos, o elimínalos si no aplican."
      />
      <DataTable
        columns={COLUMNS}
        rows={pendingCourts}
        getRowKey={(court) => court.id}
        empty="No hay lugares pendientes de verificar."
      />
    </div>
  );
}
