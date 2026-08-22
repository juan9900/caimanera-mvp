import { redirect, notFound } from "next/navigation";
import { verifySession, getCurrentUserProfile, getGroup, getMyFriends } from "@/lib/auth/dal";
import {
  leaveGroup,
  deleteGroup,
  removeGroupMember,
  rotateGroupInviteToken,
} from "@/app/actions/groups";
import { MatchActionForm } from "@/components/match-action-form";
import { CopyInviteLink } from "@/components/copy-invite-link";
import { RenameGroupForm } from "@/components/groups/rename-group-form";
import { GroupUserSearch } from "@/components/groups/group-user-search";
import { AddFriendButton } from "@/components/friends/add-friend-button";

export default async function GroupDetailPage(props: PageProps<"/grupos/[id]">) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const { id } = await props.params;
  const detail = await getGroup(id);
  if (!detail) notFound();

  const { group, isOwner, members, invited } = detail;
  const isMember = isOwner || members.some((m) => m.user.id === session.userId);

  const friends = isMember ? await getMyFriends() : [];
  const memberIds = new Set(members.map((m) => m.user.id));
  const invitedIds = new Set(invited.map((m) => m.user.id));
  const inviteFriends = friends.map(({ user }) => ({
    user,
    groupRelation: memberIds.has(user.id)
      ? ("miembro" as const)
      : invitedIds.has(user.id)
        ? ("invitado" as const)
        : ("ninguna" as const),
  }));

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <div className="mb-6">
        {isOwner ? (
          <RenameGroupForm groupId={group.id} name={group.name} />
        ) : (
          <h1 className="font-display text-2xl font-bold">{group.name}</h1>
        )}
      </div>

      {isMember && (
        <section className="mb-8">
          <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
            Invitar a una persona
          </h2>
          <GroupUserSearch groupId={group.id} friends={inviteFriends} />
        </section>
      )}

      {isMember && (
        <section className="mb-8">
          <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
            Link de invitación
          </h2>
          <p className="mb-2 font-body text-sm text-on-surface-variant">
            Solo funciona para quien ya tiene cuenta en la app.
          </p>
          <CopyInviteLink path={`/grupos/unirse/${group.invite_token}`} />
          {isOwner && (
            <MatchActionForm
              action={rotateGroupInviteToken}
              hiddenFields={{ groupId: group.id }}
              label="Generar un link nuevo"
              pendingLabel="Generando…"
              className="mt-2 font-label text-xs font-bold text-on-surface-variant underline"
            />
          )}
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
          Miembros ({members.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li
              key={member.membershipId}
              className="flex items-center justify-between rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
            >
              <div>
                <p className="font-body text-on-surface">{member.user.name ?? "Jugador"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {member.user.id !== session.userId && member.friendRelation === "ninguna" && (
                  <AddFriendButton userId={member.user.id} />
                )}
                {member.friendRelation === "pendiente_enviada" && (
                  <span className="font-label text-xs font-bold text-on-surface-variant">
                    Solicitud enviada
                  </span>
                )}
                {member.friendRelation === "pendiente_recibida" && (
                  <a
                    href="/amigos"
                    className="font-label text-xs font-bold text-primary-lime underline"
                  >
                    Te envió solicitud
                  </a>
                )}
                {isOwner && member.user.id !== session.userId && (
                  <MatchActionForm
                    action={removeGroupMember}
                    hiddenFields={{ groupId: group.id, userId: member.user.id }}
                    label="Quitar"
                    className="rounded-lg border border-outline-variant px-3 py-1.5 font-label text-xs font-bold text-on-surface active:scale-95"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {invited.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
            Invitados ({invited.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {invited.map((member) => (
              <li
                key={member.membershipId}
                className="flex items-center justify-between rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
              >
                <span className="font-body text-on-surface">{member.user.name ?? "Jugador"}</span>
                <span className="rounded-full bg-surface-variant px-2 py-0.5 font-label text-xs font-bold text-on-surface-variant">
                  Sin responder
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        {isOwner ? (
          <MatchActionForm
            action={deleteGroup}
            hiddenFields={{ groupId: group.id }}
            label="Eliminar grupo"
            pendingLabel="Eliminando…"
            className="rounded-lg border border-dark-error px-4 py-2 font-label text-xs font-bold text-dark-error"
          />
        ) : (
          <MatchActionForm
            action={leaveGroup}
            hiddenFields={{ groupId: group.id }}
            label="Salir del grupo"
            pendingLabel="Saliendo…"
            className="rounded-lg border border-outline-variant px-4 py-2 font-label text-xs font-bold text-on-surface"
          />
        )}
      </section>
    </div>
  );
}
