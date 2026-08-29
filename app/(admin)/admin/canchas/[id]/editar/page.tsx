import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourt, getCourtMetrics, getCourtSubscription, getCourtManagers } from "@/lib/auth/dal";
import { CourtPlanCard } from "@/components/admin/court-plan-card";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card, CardHeader } from "@/components/admin/ui/card";
import { EditCourtForm } from "./edit-court-form";

const METRIC_LABELS: Record<string, string> = {
  impression: "Vistas en el banner",
  click: "Clics al banner",
  whatsapp: "Contactos por WhatsApp",
  directions: "Cómo llegar",
  promo_copy: "Códigos de promo copiados",
  match_created: "Partidos creados",
};

export default async function EditCourtPage(props: PageProps<"/admin/canchas/[id]/editar">) {
  const { id } = await props.params;
  const [court, metrics, subscription, managers] = await Promise.all([
    getCourt(id),
    getCourtMetrics(id),
    getCourtSubscription(id),
    getCourtManagers(id),
  ]);
  if (!court) notFound();

  return (
    <div>
      <Link href="/admin/canchas" className="mb-2 inline-block text-sm text-green-700 hover:underline">
        ← Canchas
      </Link>
      <PageHeader title={`Editar ${court.name}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EditCourtForm court={court} />
        </div>

        <div className="space-y-6">
          {metrics && (
            <Card>
              <CardHeader title="Retorno (últimos 30 días)" />
              <dl className="grid grid-cols-2 gap-3 p-4">
                {Object.entries(METRIC_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <dt className="text-xs text-zinc-500">{label}</dt>
                    <dd className="text-lg font-semibold text-zinc-900">
                      {metrics[key as keyof typeof metrics]}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          <CourtPlanCard courtId={court.id} subscription={subscription} managers={managers} />
        </div>
      </div>
    </div>
  );
}
