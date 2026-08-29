import Link from "next/link";
import { getAdminMetrics, getActivityFeed } from "@/lib/auth/dal";
import { SELECTABLE_PLAN_ORDER, PLANS } from "@/lib/billing/plans";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Card, CardHeader } from "@/components/admin/ui/card";
import { StatCard } from "@/components/admin/ui/stat-card";
import { Users, MapPin, Goal, UserPlus, ListChecks, Activity } from "lucide-react";

const EVENT_LABELS: Record<string, string> = {
  user_joined: "Nuevo usuario",
  match_created: "Partido creado",
  join_request: "Solicitud de unión",
};

export default async function AdminPage() {
  const [metrics, activity] = await Promise.all([getAdminMetrics(), getActivityFeed()]);

  return (
    <div>
      <PageHeader
        title="Resumen"
        description="Métricas y actividad de toda la app, sin restricciones de red."
      />

      {metrics && (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Usuarios" value={metrics.totalUsers} icon={Users} href="/admin/usuarios" />
          <StatCard label="Nuevos (7 días)" value={metrics.newUsersLast7Days} icon={UserPlus} />
          <StatCard label="Canchas" value={metrics.totalCourts} icon={MapPin} href="/admin/canchas" />
          <StatCard label="Partidos totales" value={metrics.totalMatches} icon={Goal} href="/admin/partidos" />
          <StatCard label="Partidos abiertos" value={metrics.matchesByStatus.abierto} icon={ListChecks} />
          <StatCard label="Participaciones" value={metrics.totalParticipants} icon={Activity} />
        </div>
      )}

      {metrics && (
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-medium text-zinc-700">Canchas por plan</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SELECTABLE_PLAN_ORDER.map((plan) => (
              <StatCard
                key={plan}
                label={PLANS[plan].label}
                value={metrics.courtsByPlan[plan]}
                hint={`US$ ${PLANS[plan].priceUsdMonthly}/mes`}
                href="/admin/canchas"
              />
            ))}
          </div>
          {metrics.courtsExpiringSoon > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              {metrics.courtsExpiringSoon}{" "}
              {metrics.courtsExpiringSoon === 1 ? "cancha vence" : "canchas vencen"} en los
              próximos 7 días —{" "}
              <Link href="/admin/canchas" className="font-medium underline">
                revisar
              </Link>
              .
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader title="Actividad reciente" />
        {activity.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">Todavía no hay actividad.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {activity.map((event) => (
              <li key={`${event.type}-${event.id}`} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-zinc-900">
                  <span className="font-medium">{EVENT_LABELS[event.type]}</span>
                  {event.type === "user_joined" && ` · ${event.name ?? "Jugador"}`}
                  {event.type === "match_created" &&
                    ` · ${event.sport} · organiza ${event.organizerName ?? "alguien"}`}
                  {event.type === "join_request" && ` · ${event.userName ?? "Jugador"}`}
                </p>
                <p className="shrink-0 text-xs text-zinc-500">
                  {new Date(event.createdAt).toLocaleString("es-VE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/Caracas",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
