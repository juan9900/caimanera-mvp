import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { verifySession, getCurrentUserProfile, getIsAdmin, getCourt, getCourtMetrics } from "@/lib/auth/dal";
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
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { id } = await props.params;
  const [court, metrics] = await Promise.all([getCourt(id), getCourtMetrics(id)]);
  if (!court) notFound();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <Link href="/admin/canchas" className="mb-4 inline-block text-sm text-green-700 hover:underline">
          ← Canchas
        </Link>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
          Editar {court.name}
        </h1>

        {metrics && (
          <div className="mb-8 rounded-md border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-medium text-zinc-700">
              Retorno (últimos 30 días)
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(METRIC_LABELS).map(([key, label]) => (
                <div key={key}>
                  <dt className="text-xs text-zinc-500">{label}</dt>
                  <dd className="text-lg font-semibold text-zinc-900">
                    {metrics[key as keyof typeof metrics]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <EditCourtForm court={court} />
      </div>
    </div>
  );
}
