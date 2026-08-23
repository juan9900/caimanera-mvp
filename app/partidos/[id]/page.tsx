import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  verifySession,
  getCurrentUserProfile,
  getMatch,
  getMatchParticipants,
  getMyParticipation,
  getMyFriends,
  getMyGroups,
  getFriendRelations,
  getGroupRelations,
} from "@/lib/auth/dal";
import {
  joinMatch,
  leaveMatch,
  respondToRequest,
  respondToInvitation,
  removeParticipant,
  cancelMatch,
  reopenMatch,
  setMatchVisibility,
} from "@/app/actions/matches";
import { ShareMatchButton } from "@/components/share-match-button";
import { MatchActionForm } from "@/components/match-action-form";
import { MatchVisibilitySwitch } from "@/components/matches/match-visibility-switch";
import { InvitePlayers } from "@/components/matches/invite-players";
import { AddFriendButton } from "@/components/friends/add-friend-button";
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
const JOINED_VIA_LABELS: Record<string, string> = {
  red_directa: "Red directa",
  externo: "Externo",
};

const PRIMARY_BUTTON =
  "rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50";
const OUTLINE_BUTTON =
  "rounded-lg border border-surface-variant px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-surface disabled:opacity-50";
const DANGER_BUTTON =
  "rounded-lg border border-dark-error/50 px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-dark-error disabled:opacity-50";
const SMALL_PRIMARY_BUTTON =
  "rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary disabled:opacity-50";
const SMALL_OUTLINE_BUTTON =
  "rounded-lg border border-surface-variant px-3 py-1.5 font-label text-xs font-bold text-on-surface disabled:opacity-50";

export default async function MatchDetailPage(
  props: PageProps<"/partidos/[id]">,
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
  const friends = isOrganizer && match.status === "abierto" ? await getMyFriends() : [];
  const groups = isOrganizer && match.status === "abierto" ? await getMyGroups() : [];

  const confirmed = participants.filter((p) => p.status === "confirmado");
  const pending = participants.filter((p) => p.status === "pendiente");
  const invited = participants.filter((p) => p.status === "invitado");

  const pendingUserIds = pending
    .map((p) => p.user?.id)
    .filter((id): id is string => Boolean(id));
  const [pendingFriendRelations, pendingGroupRelations] = isOrganizer
    ? await Promise.all([
        getFriendRelations(pendingUserIds),
        getGroupRelations(pendingUserIds),
      ])
    : [new Map<string, string>(), new Set<string>()];

  const confirmedUserIds = confirmed
    .map((p) => p.user?.id)
    .filter((id): id is string => Boolean(id) && id !== profile.id);
  const confirmedFriendRelations = await getFriendRelations(confirmedUserIds);

  function relationBadge(userId: string | undefined, joinedVia: string): string {
    if (userId && pendingFriendRelations.get(userId) === "amigos") return "Amigo";
    if (userId && pendingGroupRelations.has(userId)) return "Compañero de grupo";
    return JOINED_VIA_LABELS[joinedVia];
  }

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <div className="mb-4">
        <MatchVisibilitySwitch
          matchId={match.id}
          initialVisibility={match.visibility}
          editable={isOrganizer}
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold">
            {SPORT_LABELS[match.sport] ?? match.sport} en{" "}
            {match.court?.name ?? "cancha"}
          </h1>
          <span
            className={`rounded-full px-2 py-0.5 font-label text-xs font-bold ${
              match.status === "vencido"
                ? "bg-dark-error/20 text-dark-error"
                : "bg-surface-variant text-on-surface-variant"
            }`}
          >
            {STATUS_LABELS[match.status]}
          </span>
          {match.visibility !== "publica" && (
            <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 font-label text-xs font-bold text-on-secondary-container">
              {match.visibility === "amigos" ? "Amigos" : "Privada"}
            </span>
          )}
        </div>
        {match.status !== "cancelado" && (
          <ShareMatchButton
            title={`${SPORT_LABELS[match.sport] ?? match.sport} en ${match.court?.name ?? "cancha"}`}
            datetime={match.datetime}
          />
        )}
      </div>

      <dl className="divide-y divide-surface-variant/50 rounded-xl border border-surface-variant/50 bg-surface-container font-body text-sm">
        <div className="flex justify-between px-4 py-3">
          <dt className="text-on-surface-variant">Fecha y hora</dt>
          <dd className={match.status === "vencido" ? "font-medium text-dark-error" : "text-on-surface"}>
            {new Date(match.datetime).toLocaleString("es-VE", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {match.status === "vencido" && " · Ya comenzó"}
          </dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-on-surface-variant">Vibra</dt>
          <dd className="text-on-surface">{VIBE_LABELS[match.vibe]}</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-on-surface-variant">Organiza</dt>
          <dd className="text-on-surface">{match.organizer?.name ?? "—"}</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-on-surface-variant">Cupos</dt>
          <dd className="text-on-surface">
            {match.slots_filled}/{match.total_slots}
          </dd>
        </div>
      </dl>

      {match.payment_amount_bs != null && (
        <dl className="mt-4 divide-y divide-surface-variant/50 rounded-xl border border-surface-variant/50 bg-surface-container font-body text-sm">
          <div className="flex justify-between px-4 py-3">
            <dt className="text-on-surface-variant">Costo por persona</dt>
            <dd className="font-medium text-on-surface">
              {(match.payment_amount_bs / match.total_slots).toLocaleString("es-VE", {
                maximumFractionDigits: 2,
              })}{" "}
              Bs
            </dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-on-surface-variant">Monto total</dt>
            <dd className="text-on-surface">
              {match.payment_amount_bs.toLocaleString("es-VE", {
                maximumFractionDigits: 2,
              })}{" "}
              Bs
            </dd>
          </div>
          {match.payment_bank && (
            <div className="flex justify-between px-4 py-3">
              <dt className="text-on-surface-variant">Banco</dt>
              <dd className="text-on-surface">{match.payment_bank}</dd>
            </div>
          )}
          {match.payment_phone && (
            <div className="flex justify-between px-4 py-3">
              <dt className="text-on-surface-variant">Teléfono</dt>
              <dd className="text-on-surface">{match.payment_phone}</dd>
            </div>
          )}
          {match.payment_cedula && (
            <div className="flex justify-between px-4 py-3">
              <dt className="text-on-surface-variant">Cédula</dt>
              <dd className="text-on-surface">{match.payment_cedula}</dd>
            </div>
          )}
        </dl>
      )}

      <p className="mt-6 font-label text-xs text-on-surface-variant">
        {match.slots_filled}/{match.total_slots} cupos ocupados
      </p>

      <div className="mt-6">
        {isOrganizer ? (
          match.status === "vencido" && (
            <MatchActionForm
              action={reopenMatch}
              hiddenFields={{ matchId: match.id }}
              label="Pedir más jugadores"
              pendingLabel="Reabriendo…"
              className={PRIMARY_BUTTON}
            />
          )
        ) : match.status === "cancelado" || match.status === "vencido" ? null : myParticipation ? (
          myParticipation.status === "confirmado" ? (
            <MatchActionForm
              action={leaveMatch}
              hiddenFields={{ matchId: match.id }}
              label="Salir del partido"
              pendingLabel="Saliendo…"
              className={OUTLINE_BUTTON}
            />
          ) : myParticipation.status === "invitado" ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-body text-sm text-on-surface-variant">
                Te invitaron a este partido.
              </p>
              <MatchActionForm
                action={respondToInvitation}
                hiddenFields={{ participantId: myParticipation.id, matchId: match.id, accept: "true" }}
                label="Aceptar"
                pendingLabel="Aceptando…"
                className={PRIMARY_BUTTON}
              />
              <MatchActionForm
                action={respondToInvitation}
                hiddenFields={{ participantId: myParticipation.id, matchId: match.id, accept: "false" }}
                label="Rechazar"
                pendingLabel="Rechazando…"
                className={SMALL_OUTLINE_BUTTON}
              />
            </div>
          ) : myParticipation.status === "pendiente" ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-body text-sm text-on-surface-variant">
                Tu solicitud está pendiente de aprobación.
              </p>
              <MatchActionForm
                action={leaveMatch}
                hiddenFields={{ matchId: match.id }}
                label="Cancelar solicitud"
                pendingLabel="Cancelando…"
                className={SMALL_OUTLINE_BUTTON}
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-body text-sm text-on-surface-variant">
                Tu solicitud fue rechazada.
              </p>
              <MatchActionForm
                action={leaveMatch}
                hiddenFields={{ matchId: match.id }}
                label="Quitar solicitud"
                pendingLabel="Quitando…"
                className={SMALL_OUTLINE_BUTTON}
              />
            </div>
          )
        ) : match.visibility !== "privada" ? (
          <MatchActionForm
            action={joinMatch}
            hiddenFields={{ matchId: match.id }}
            label="Unirse"
            pendingLabel="Uniendo…"
            className={PRIMARY_BUTTON}
          />
        ) : (
          <p className="font-body text-sm text-on-surface-variant">
            Este partido es privado — solo entra quien reciba una invitación.
          </p>
        )}
      </div>

      {isOrganizer && match.status === "abierto" && match.slots_filled < match.total_slots && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold text-on-surface">
            Invitar jugadores
          </h2>
          <InvitePlayers
            matchId={match.id}
            friends={friends}
            groups={groups}
            excludedUserIds={participants.map((p) => p.user_id)}
          />
          {match.visibility !== "publica" && (
            <div className="mt-4 rounded-xl border border-dashed border-primary-lime/50 bg-secondary-container/20 p-4">
              <p className="font-body text-sm text-on-surface">
                ¿Sigues necesitando gente? Hazla pública para que cualquiera pueda verla y unirse.
              </p>
              <MatchActionForm
                action={setMatchVisibility}
                hiddenFields={{ matchId: match.id, visibility: "publica" }}
                label="Hacer pública"
                pendingLabel="Actualizando…"
                className={`${SMALL_PRIMARY_BUTTON} mt-3`}
              />
            </div>
          )}
        </div>
      )}

      {isOrganizer && invited.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold text-on-surface">
            Invitados ({invited.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {invited.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
              >
                <span className="font-body text-on-surface">{p.user?.name ?? "Jugador"}</span>
                <span className="rounded-full bg-surface-variant px-2 py-0.5 font-label text-xs font-bold text-on-surface-variant">
                  Sin responder
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOrganizer && pending.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold text-on-surface">
            Solicitudes pendientes
          </h2>
          <ul className="flex flex-col gap-2">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-body text-on-surface">
                    {p.user?.name ?? "Jugador"}
                  </span>
                  <span className="rounded-full bg-surface-variant px-2 py-0.5 font-label text-xs font-bold text-on-surface-variant">
                    {relationBadge(p.user?.id, p.joined_via)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <MatchActionForm
                      action={respondToRequest}
                      hiddenFields={{
                        participantId: p.id,
                        matchId: match.id,
                        approve: "true",
                      }}
                      label="Aprobar"
                      className={`${SMALL_PRIMARY_BUTTON} w-full text-center`}
                    />
                  </div>
                  <div className="flex-1">
                    <MatchActionForm
                      action={respondToRequest}
                      hiddenFields={{
                        participantId: p.id,
                        matchId: match.id,
                        approve: "false",
                      }}
                      label="Rechazar"
                      className={`${SMALL_OUTLINE_BUTTON} w-full text-center`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold text-on-surface">
          Confirmados ({confirmed.length})
        </h2>
        {confirmed.length === 0 ? (
          <p className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center font-body text-on-surface-variant">
            Todavía nadie confirma.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {confirmed.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
              >
                <span className="flex items-center gap-2">
                  <span className="font-body text-on-surface">
                    {p.user?.name ?? "Jugador"}
                  </span>
                  <span className="rounded-full bg-surface-variant px-2 py-0.5 font-label text-xs font-bold text-on-surface-variant">
                    {JOINED_VIA_LABELS[p.joined_via]}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {p.user?.id &&
                    p.user.id !== profile.id &&
                    (() => {
                      const relation = confirmedFriendRelations.get(p.user.id);
                      if (relation === "pendiente_enviada") {
                        return (
                          <span className="font-label text-xs font-bold text-on-surface-variant">
                            Solicitud enviada
                          </span>
                        );
                      }
                      if (relation === "pendiente_recibida") {
                        return (
                          <Link
                            href="/amigos"
                            className="font-label text-xs font-bold text-primary-lime underline"
                          >
                            Te envió solicitud
                          </Link>
                        );
                      }
                      if (relation !== "amigos") {
                        return <AddFriendButton userId={p.user.id} />;
                      }
                      return null;
                    })()}
                  {isOrganizer && p.user?.id !== profile.id && (
                    <MatchActionForm
                      action={removeParticipant}
                      hiddenFields={{
                        participantId: p.id,
                        matchId: match.id,
                      }}
                      label="Quitar"
                      className="font-label text-xs font-bold text-dark-error hover:underline disabled:opacity-50"
                    />
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isOrganizer && match.status !== "cancelado" && (
        <div className="mt-8 flex flex-wrap gap-3">
          {(match.status === "abierto" || match.status === "completo") && (
            <Link href={`/partidos/${match.id}/editar`} className={OUTLINE_BUTTON}>
              Editar partido
            </Link>
          )}
          <MatchActionForm
            action={cancelMatch}
            hiddenFields={{ matchId: match.id }}
            label="Cancelar partido"
            pendingLabel="Cancelando…"
            className={DANGER_BUTTON}
          />
        </div>
      )}

      <Link
        href="/partidos"
        className="mt-8 inline-flex items-center gap-1 font-body text-sm text-on-surface-variant hover:text-primary-lime"
      >
        <ArrowLeft aria-hidden size={16} />
        Volver a partidos
      </Link>
    </div>
  );
}
