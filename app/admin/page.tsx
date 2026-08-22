import { redirect } from "next/navigation";
import Link from "next/link";
import {
  verifySession,
  getCurrentUserProfile,
  getIsAdmin,
  getAdminMetrics,
  getActivityFeed,
} from "@/lib/auth/dal";

const EVENT_LABELS: Record<string, string> = {
  user_joined: "Nuevo usuario",
  match_created: "Partido creado",
  join_request: "Solicitud de unión",
};

export default async function AdminPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const [metrics, activity] = await Promise.all([getAdminMetrics(), getActivityFeed()]);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Panel de administrador
        </h1>
        <p className="mb-6 text-zinc-600">
          Métricas y actividad de toda la app, sin restricciones de red.
        </p>

        <nav className="mb-8 flex gap-4 text-sm">
          <Link href="/admin/usuarios" className="text-green-700 hover:underline">
            Usuarios
          </Link>
          <Link href="/admin/partidos" className="text-green-700 hover:underline">
            Partidos
          </Link>
          <Link href="/admin/canchas" className="text-green-700 hover:underline">
            Canchas
          </Link>
        </nav>

        {metrics && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard label="Usuarios" value={metrics.totalUsers} />
            <MetricCard label="Nuevos (7 días)" value={metrics.newUsersLast7Days} />
            <MetricCard label="Canchas" value={metrics.totalCourts} />
            <MetricCard label="Partidos totales" value={metrics.totalMatches} />
            <MetricCard label="Partidos abiertos" value={metrics.matchesByStatus.abierto} />
            <MetricCard label="Participaciones" value={metrics.totalParticipants} />
          </div>
        )}

        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-700">Actividad reciente</h2>
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
            {activity.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">
                Todavía no hay actividad.
              </li>
            )}
            {activity.map((event) => (
              <li key={`${event.type}-${event.id}`} className="px-4 py-3">
                <p className="text-zinc-900">
                  <span className="font-medium">{EVENT_LABELS[event.type]}</span>
                  {event.type === "user_joined" && ` · ${event.name ?? "Jugador"}`}
                  {event.type === "match_created" &&
                    ` · ${event.sport} · organiza ${event.organizerName ?? "alguien"}`}
                  {event.type === "join_request" && ` · ${event.userName ?? "Jugador"}`}
                </p>
                <p className="text-sm text-zinc-500">
                  {new Date(event.createdAt).toLocaleString("es-VE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/Caracas",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
      <p className="text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}
