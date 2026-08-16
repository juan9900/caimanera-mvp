import { redirect, notFound } from "next/navigation";
import { verifySession, getCurrentUserProfile, getCourt } from "@/lib/auth/dal";
import { CourtsMap } from "@/components/courts-map";

export default async function CourtDetailPage(
  props: PageProps<"/canchas/[id]">
) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const { id } = await props.params;
  const court = await getCourt(id);
  if (!court) notFound();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {court.name}
          </h1>
          {court.is_official && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Oficial
            </span>
          )}
        </div>

        <CourtsMap courts={[court]} />

        <dl className="mt-8 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white text-sm">
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Horario</dt>
            <dd className="text-zinc-900">{court.schedule ?? "No especificado"}</dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Contacto</dt>
            <dd className="text-zinc-900">
              {court.contact_phone ?? "No especificado"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
