import { redirect } from "next/navigation";
import Link from "next/link";
import {
  verifySession,
  getCurrentUserProfile,
  getOpenMatches,
  getMyMatches,
  type MatchWithCourt,
} from "@/lib/auth/dal";
import { SPORT_LABELS } from "@/lib/matches/home";
const VIBE_LABELS: Record<string, string> = {
  relajado: "Relajado",
  competitivo: "Competitivo",
};
const STATUS_LABELS: Record<string, string> = {
  abierto: "Abierto",
  completo: "Completo",
  cancelado: "Cancelado",
  vencido: "Vencido",
};

function MatchListItem({ match, showOrganizer }: { match: MatchWithCourt; showOrganizer: boolean }) {
  const started = new Date(match.datetime) < new Date();

  return (
    <li>
      <Link
        href={`/partidos/${match.id}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-surface-variant/50 bg-surface-container p-4 transition-transform active:scale-[0.98]"
      >
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-display font-bold text-on-surface">
            {match.court?.name ?? "Cancha"} · {SPORT_LABELS[match.sport] ?? match.sport}
            {match.status !== "abierto" && (
              <span className="rounded-full bg-surface-variant px-2 py-0.5 font-label text-xs font-bold text-on-surface-variant">
                {STATUS_LABELS[match.status]}
              </span>
            )}
            {!match.is_public && (
              <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 font-label text-xs font-bold text-on-secondary-container">
                Privada
              </span>
            )}
          </p>
          <p className="font-body text-sm text-on-surface-variant">
            <span className={started ? "font-semibold text-dark-error" : undefined}>
              {started
                ? "Ya comenzó"
                : new Date(match.datetime).toLocaleString("es-VE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
            </span>{" "}
            · {VIBE_LABELS[match.vibe]}
            {showOrganizer ? ` · organiza ${match.organizer?.name ?? "alguien"}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-variant px-2 py-0.5 font-label text-xs font-bold text-on-surface">
          {match.slots_filled}/{match.total_slots}
        </span>
      </Link>
    </li>
  );
}

export default async function PartidosPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const [openMatches, myMatches] = await Promise.all([getOpenMatches(), getMyMatches()]);
  // Own matches get their own section below, so drop them from the general
  // public list to avoid showing the same match twice.
  const otherMatches = openMatches.filter((m) => m.organizer_id !== session.userId);

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Partidos</h1>
        <Link
          href="/partidos/nuevo"
          className="rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)]"
        >
          Armar partido
        </Link>
      </div>

      {myMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-lg font-bold text-on-surface">Mis partidos</h2>
          <ul className="flex flex-col gap-3">
            {myMatches.map((match) => (
              <MatchListItem key={match.id} match={match} showOrganizer={false} />
            ))}
          </ul>
        </div>
      )}

      {otherMatches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center font-body text-on-surface-variant">
          {myMatches.length > 0
            ? "No hay más partidos abiertos por ahora."
            : "Todavía no hay partidos abiertos. Arma el primero."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {otherMatches.map((match) => (
            <MatchListItem key={match.id} match={match} showOrganizer />
          ))}
        </ul>
      )}
    </div>
  );
}
