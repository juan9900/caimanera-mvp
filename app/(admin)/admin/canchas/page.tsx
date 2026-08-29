import { getAllCourts } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/ui/page-header";
import { LinkButton } from "@/components/admin/ui/button";
import { CanchasTable } from "@/components/admin/canchas-table";

export default async function AdminCanchasPage() {
  const courts = await getAllCourts();

  return (
    <div>
      <PageHeader
        title={`Canchas (${courts.length})`}
        action={<LinkButton href="/admin/canchas/nueva">Agregar cancha</LinkButton>}
      />
      <CanchasTable courts={courts} />
    </div>
  );
}
