import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession, getCurrentUserProfile, getIsAdmin, getAllCourts } from "@/lib/auth/dal";

export default async function AdminCanchasPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const courts = await getAllCourts();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <Link href="/admin" className="mb-4 inline-block text-sm text-green-700 hover:underline">
          ← Panel de administrador
        </Link>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Canchas ({courts.length})
          </h1>
          <Link
            href="/admin/canchas/nueva"
            className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            Agregar cancha
          </Link>
        </div>

        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {courts.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              Todavía no hay canchas cargadas.
            </li>
          )}
          {courts.map((court) => {
            const sponsored = court.sponsored_until != null && new Date(court.sponsored_until) > new Date();
            return (
              <li key={court.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50">
                <Link href={`/canchas/${court.id}`} className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900">{court.name}</span>
                  {court.is_official && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Oficial
                    </span>
                  )}
                  {sponsored && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Patrocinada
                    </span>
                  )}
                  {court.is_public && (
                    <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-800">
                      Lugar público
                    </span>
                  )}
                </Link>
                <Link
                  href={`/admin/canchas/${court.id}/editar`}
                  className="text-xs font-medium text-green-700 hover:underline"
                >
                  Editar
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
