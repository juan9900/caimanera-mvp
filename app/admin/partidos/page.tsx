import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession, getCurrentUserProfile, getIsAdmin, getAllMatches } from "@/lib/auth/dal";
import { SPORT_LABELS } from "@/lib/matches/home";
const STATUS_LABELS: Record<string, string> = {
  abierto: "Abierto",
  completo: "Completo",
  cancelado: "Cancelado",
  vencido: "Vencido",
};
const STATUS_STYLES: Record<string, string> = {
  abierto: "bg-green-100 text-green-700",
  completo: "bg-zinc-100 text-zinc-700",
  cancelado: "bg-red-100 text-red-700",
  vencido: "bg-red-100 text-red-700",
};

export default async function AdminPartidosPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const matches = await getAllMatches();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <Link href="/admin" className="mb-4 inline-block text-sm text-green-700 hover:underline">
          ← Panel de administrador
        </Link>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
          Partidos ({matches.length})
        </h1>

        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {matches.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              Todavía no hay partidos.
            </li>
          )}
          {matches.map((match) => (
            <li key={match.id}>
              <Link
                href={`/partidos/${match.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {match.court?.name ?? "Cancha"} · {SPORT_LABELS[match.sport] ?? match.sport}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {new Date(match.datetime).toLocaleString("es-VE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · organiza {match.organizer?.name ?? "alguien"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[match.status]}`}
                >
                  {STATUS_LABELS[match.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
