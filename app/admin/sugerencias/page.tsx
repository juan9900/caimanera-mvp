import { redirect } from "next/navigation";
import Link from "next/link";
import {
  verifySession,
  getCurrentUserProfile,
  getIsAdmin,
  getPendingCourts,
} from "@/lib/auth/dal";
import { verifyCourt, deletePendingCourt } from "@/app/actions/courts";

export default async function AdminSugerenciasPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const pendingCourts = await getPendingCourts();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <Link href="/admin" className="mb-4 inline-block text-sm text-green-700 hover:underline">
          ← Panel de administrador
        </Link>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Lugares pendientes de verificar ({pendingCourts.length})
        </h1>
        <p className="mb-6 text-zinc-600">
          Lugares que agregaron usuarios desde el mapa o al crear un partido. Ya están activos
          para quien los agregó; verifica para que sean visibles para todos, o elimínalos si no
          aplican.
        </p>

        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {pendingCourts.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              No hay lugares pendientes de verificar.
            </li>
          )}
          {pendingCourts.map((court) => (
            <li key={court.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900">{court.name}</p>
                <p className="text-xs text-zinc-500">
                  {court.lat.toFixed(5)}, {court.lng.toFixed(5)}
                  {" · "}
                  {court.addedByUser?.name ?? "Alguien"}
                  {" · "}
                  {new Date(court.created_at).toLocaleDateString("es-VE", {
                    dateStyle: "medium",
                  })}
                </p>
                {court.address && (
                  <p className="mt-1 text-sm text-zinc-600">{court.address}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={verifyCourt.bind(null, court.id)}>
                  <button
                    type="submit"
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Verificar
                  </button>
                </form>
                <form action={deletePendingCourt.bind(null, court.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
