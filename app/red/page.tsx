import { redirect } from "next/navigation";
import Link from "next/link";
import {
  verifySession,
  getCurrentUserProfile,
  getMyInvitees,
  getMyInviter,
  getMyFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  getMyGroups,
} from "@/lib/auth/dal";
import { CopyInviteLink } from "@/components/copy-invite-link";
import { FriendSearch } from "@/components/friends/friend-search";
import { MatchActionForm } from "@/components/match-action-form";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "@/app/actions/friends";

export default async function RedPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const [invitees, inviter, friends, incomingRequests, outgoingRequests, groups] =
    await Promise.all([
      getMyInvitees(),
      getMyInviter(),
      getMyFriends(),
      getIncomingFriendRequests(),
      getOutgoingFriendRequests(),
      getMyGroups(),
    ]);

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-2 font-display text-2xl font-bold">Mi red</h1>
      <p className="mb-6 font-body text-on-surface-variant">
        Cuando pides unirte a un partido, el organizador ve si eres de su red
        directa o externo — pero siempre debe aprobar tu solicitud.
      </p>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
          Buscar y agregar amigos
        </h2>
        <FriendSearch />
      </section>

      {incomingRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
            Solicitudes recibidas ({incomingRequests.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {incomingRequests.map((request) => (
              <li
                key={request.friendshipId}
                className="flex items-center justify-between rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
              >
                <div>
                  <p className="font-body text-on-surface">
                    {request.user.name ?? "Jugador"}
                  </p>
                  {request.user.zone && (
                    <p className="font-body text-sm text-on-surface-variant">
                      {request.user.zone}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <MatchActionForm
                    action={acceptFriendRequest}
                    hiddenFields={{ friendshipId: request.friendshipId }}
                    label="Aceptar"
                    className="rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary active:scale-95"
                  />
                  <MatchActionForm
                    action={rejectFriendRequest}
                    hiddenFields={{ friendshipId: request.friendshipId }}
                    label="Rechazar"
                    className="rounded-lg border border-outline-variant px-3 py-1.5 font-label text-xs font-bold text-on-surface active:scale-95"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoingRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
            Solicitudes enviadas ({outgoingRequests.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {outgoingRequests.map((request) => (
              <li
                key={request.friendshipId}
                className="flex items-center justify-between rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
              >
                <div>
                  <p className="font-body text-on-surface">
                    {request.user.name ?? "Jugador"}
                  </p>
                  {request.user.zone && (
                    <p className="font-body text-sm text-on-surface-variant">
                      {request.user.zone}
                    </p>
                  )}
                </div>
                <MatchActionForm
                  action={cancelFriendRequest}
                  hiddenFields={{ friendshipId: request.friendshipId }}
                  label="Cancelar"
                  className="shrink-0 rounded-lg border border-outline-variant px-3 py-1.5 font-label text-xs font-bold text-on-surface active:scale-95"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
          Mis amigos ({friends.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {friends.length === 0 && (
            <li className="rounded-xl border border-dashed border-surface-variant px-4 py-6 text-center font-body text-sm text-on-surface-variant">
              Todavía no tienes amigos agregados.
            </li>
          )}
          {friends.map((friend) => (
            <li
              key={friend.friendshipId}
              className="flex items-center justify-between rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
            >
              <div>
                <p className="font-body text-on-surface">{friend.user.name ?? "Jugador"}</p>
                {friend.user.zone && (
                  <p className="font-body text-sm text-on-surface-variant">
                    {friend.user.zone}
                  </p>
                )}
              </div>
              <MatchActionForm
                action={removeFriend}
                hiddenFields={{ friendshipId: friend.friendshipId }}
                label="Eliminar"
                className="shrink-0 rounded-lg border border-outline-variant px-3 py-1.5 font-label text-xs font-bold text-on-surface active:scale-95"
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-on-surface">
            Mis grupos ({groups.length})
          </h2>
          <Link href="/grupos" className="font-label text-xs font-bold text-primary-lime">
            Ver todos
          </Link>
        </div>
        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-surface-variant px-4 py-6 text-center font-body text-sm text-on-surface-variant">
            Junta a tus amigos en grupos para invitarlos de un toque a tus partidos.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {groups.map(({ group, memberCount }) => (
              <li key={group.id}>
                <Link
                  href={`/grupos/${group.id}`}
                  className="flex items-center justify-between rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
                >
                  <p className="font-body text-on-surface">{group.name}</p>
                  <p className="font-body text-sm text-on-surface-variant">
                    {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
          Quién te invitó
        </h2>
        <div className="rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3">
          {inviter ? (
            <p className="font-body text-on-surface">
              {inviter.name ?? "Jugador"}
              {inviter.zone && (
                <span className="text-on-surface-variant"> · {inviter.zone}</span>
              )}
            </p>
          ) : (
            <p className="font-body text-sm text-on-surface-variant">
              Entraste como fundador, sin invitación.
            </p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
          Tu link de invitación
        </h2>
        <p className="mb-2 font-body text-sm text-on-surface-variant">
          Es fijo y podés compartirlo con quien quieras, las veces que quieras.
        </p>
        <CopyInviteLink path={`/signup?ref=${profile.referral_code}`} />
      </section>

      <section>
        <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
          Quién invitaste ({invitees.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {invitees.length === 0 && (
            <li className="rounded-xl border border-dashed border-surface-variant px-4 py-6 text-center font-body text-sm text-on-surface-variant">
              Todavía no invitaste a nadie de tu red directa.
            </li>
          )}
          {invitees.map((user) => (
            <li key={user.id} className="rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3">
              <p className="font-body text-on-surface">{user.name ?? "Jugador"}</p>
              {user.zone && (
                <p className="font-body text-sm text-on-surface-variant">{user.zone}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
