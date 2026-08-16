import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  verifySession,
  getCurrentUserProfile,
  getMatch,
  getMatchParticipants,
  getMyParticipation,
} from "@/lib/auth/dal";
import {
  joinMatch,
  leaveMatch,
  respondToRequest,
  removeParticipant,
  cancelMatch,
} from "@/app/actions/matches";
import { ShareMatchButton } from "@/components/share-match-button";
import { MatchActionForm } from "@/components/match-action-form";
import { NotifyNeedPlayersForm } from "@/components/notify-need-players-form";
import { EnableNotifications } from "@/components/enable-notifications";

const SPORT_LABELS: Record<string, string> = { futbol: "Fútbol", tenis: "Tenis" };
const VIBE_LABELS: Record<string, string> = {
  relajado: "Relajado",
  competitivo: "Competitivo",
};
const STATUS_LABELS: Record<string, string> = {
  abierto: "Abierto",
  completo: "Completo",
  cancelado: "Cancelado",
};
const JOINED_VIA_LABELS: Record<string, string> = {
  red_directa: "Red directa",
  externo: "Externo",
};

export default async function MatchDetailPage(
  props: PageProps<"/partidos/[id]">
) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const { id } = await props.params;
  const match = await getMatch(id);
  if (!match) notFound();

  const isOrganizer = match.organizer_id === session.userId;
  const participants = await getMatchParticipants(id);
  const myParticipation = isOrganizer ? null : await getMyParticipation(id);

  const confirmed = participants.filter((p) => p.status === "confirmado");
  const pending = participants.filter((p) => p.status === "pendiente");

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {SPORT_LABELS[match.sport] ?? match.sport} en{" "}
              {match.court?.name ?? "cancha"}
            </h1>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
              {STATUS_LABELS[match.status]}
            </span>
          </div>
          {match.status !== "cancelado" && (
            <ShareMatchButton
              title={`${SPORT_LABELS[match.sport] ?? match.sport} en ${match.court?.name ?? "cancha"}`}
              datetime={match.datetime}
            />
          )}
        </div>

        <dl className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white text-sm">
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Fecha y hora</dt>
            <dd className="text-zinc-900">
              {new Date(match.datetime).toLocaleString("es-VE", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Vibra</dt>
            <dd className="text-zinc-900">{VIBE_LABELS[match.vibe]}</dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Organiza</dt>
            <dd className="text-zinc-900">{match.organizer?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-zinc-500">Cupos</dt>
            <dd className="text-zinc-900">
              {match.slots_filled}/{match.total_slots}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            {match.slots_filled}/{match.total_slots} cupos ocupados
          </p>
          <EnableNotifications />
        </div>

        {isOrganizer && match.status === "abierto" && match.slots_filled < match.total_slots && (
          <div className="mt-4">
            <NotifyNeedPlayersForm matchId={match.id} />
          </div>
        )}

        <div className="mt-6">
          {isOrganizer ? (
            match.status !== "cancelado" && (
              <MatchActionForm
                action={cancelMatch}
                hiddenFields={{ matchId: match.id }}
                label="Cancelar partido"
                pendingLabel="Cancelando…"
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              />
            )
          ) : match.status === "cancelado" ? null : myParticipation ? (
            myParticipation.status === "confirmado" ? (
              <MatchActionForm
                action={leaveMatch}
                hiddenFields={{ matchId: match.id }}
                label="Salir del partido"
                pendingLabel="Saliendo…"
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              />
            ) : myParticipation.status === "pendiente" ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-zinc-500">Tu solicitud está pendiente de aprobación.</p>
                <MatchActionForm
                  action={leaveMatch}
                  hiddenFields={{ matchId: match.id }}
                  label="Cancelar solicitud"
                  pendingLabel="Cancelando…"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-zinc-500">Tu solicitud fue rechazada.</p>
                <MatchActionForm
                  action={leaveMatch}
                  hiddenFields={{ matchId: match.id }}
                  label="Quitar solicitud"
                  pendingLabel="Quitando…"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                />
              </div>
            )
          ) : (
            <MatchActionForm
              action={joinMatch}
              hiddenFields={{ matchId: match.id }}
              label="Unirse"
              pendingLabel="Uniendo…"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            />
          )}
        </div>

        {isOrganizer && pending.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-2 text-sm font-medium text-zinc-700">
              Solicitudes pendientes
            </h2>
            <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
              {pending.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-900">{p.user?.name ?? "Jugador"}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      {JOINED_VIA_LABELS[p.joined_via]}
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <MatchActionForm
                      action={respondToRequest}
                      hiddenFields={{ participantId: p.id, matchId: match.id, approve: "true" }}
                      label="Aprobar"
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    />
                    <MatchActionForm
                      action={respondToRequest}
                      hiddenFields={{ participantId: p.id, matchId: match.id, approve: "false" }}
                      label="Rechazar"
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-2 text-sm font-medium text-zinc-700">
            Confirmados ({confirmed.length})
          </h2>
          {confirmed.length === 0 ? (
            <p className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-500">
              Todavía nadie confirma.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
              {confirmed.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-900">{p.user?.name ?? "Jugador"}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      {JOINED_VIA_LABELS[p.joined_via]}
                    </span>
                  </span>
                  {isOrganizer && (
                    <MatchActionForm
                      action={removeParticipant}
                      hiddenFields={{ participantId: p.id, matchId: match.id }}
                      label="Quitar"
                      className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/partidos"
          className="mt-8 inline-block text-sm text-zinc-500 hover:text-green-700"
        >
          ← Volver a partidos
        </Link>
      </div>
    </div>
  );
}
