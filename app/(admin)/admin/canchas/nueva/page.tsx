import { PageHeader } from "@/components/admin/ui/page-header";
import { AddCourtForm } from "./add-court-form";

export default async function NuevaCanchaPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; lat?: string; lng?: string; suggestionId?: string }>;
}) {
  // Coming from "aprobar" on a user suggestion (`/admin/sugerencias`)
  // prefills the form with the suggested name/point.
  const { name, lat, lng, suggestionId } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Agregar cancha"
        description="Suma una cancha real donde puedan armar caimaneras."
      />
      <AddCourtForm initialValues={{ name, lat, lng }} suggestionId={suggestionId} />
    </div>
  );
}
