import { redirect } from "next/navigation";
import {
  verifySession,
  getCurrentUserProfile,
  getMyInvitations,
  getMyGroupInvitations,
} from "@/lib/auth/dal";
import { respondToInvitation } from "@/app/actions/matches";
import { respondToGroupInvitation } from "@/app/actions/groups";
import { MatchActionForm } from "@/components/match-action-form";
import { MatchCard } from "@/components/home/match-card";

export default async function InvitationsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const [invitations, groupInvitations] = await Promise.all([
    getMyInvitations(),
    getMyGroupInvitations(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-2 font-display text-2xl font-bold">Invitaciones</h1>
      <p className="mb-6 font-body text-on-surface-variant">
        Partidos privados y grupos a los que te invitaron directamente.
      </p>

      {groupInvitations.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 font-display text-lg font-bold text-on-surface">
            Grupos ({groupInvitations.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {groupInvitations.map((invitation) => (
              <li
                key={invitation.membershipId}
                className="flex items-center justify-between rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
              >
                <div>
                  <p className="font-body text-on-surface">{invitation.groupName}</p>
                  {invitation.inviter?.name && (
                    <p className="font-body text-sm text-on-surface-variant">
                      Invitado por {invitation.inviter.name}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <MatchActionForm
                    action={respondToGroupInvitation}
                    hiddenFields={{
                      membershipId: invitation.membershipId,
                      groupId: invitation.groupId,
                      accept: "true",
                    }}
                    label="Aceptar"
                    pendingLabel="Aceptando…"
                    className="rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary active:scale-95"
                  />
                  <MatchActionForm
                    action={respondToGroupInvitation}
                    hiddenFields={{
                      membershipId: invitation.membershipId,
                      groupId: invitation.groupId,
                      accept: "false",
                    }}
                    label="Rechazar"
                    pendingLabel="Rechazando…"
                    className="rounded-lg border border-outline-variant px-3 py-1.5 font-label text-xs font-bold text-on-surface active:scale-95"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-display text-lg font-bold text-on-surface">Partidos</h2>
        {invitations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center font-body text-on-surface-variant">
            No tienes invitaciones pendientes.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {invitations.map((invitation) => (
              <li key={invitation.participantId} className="flex flex-col gap-2">
                <MatchCard match={invitation.match} hideBadgeWhenFull />
                <div className="flex gap-2">
                  <MatchActionForm
                    action={respondToInvitation}
                    hiddenFields={{
                      participantId: invitation.participantId,
                      matchId: invitation.match.id,
                      accept: "true",
                    }}
                    label="Aceptar"
                    pendingLabel="Aceptando…"
                    className="rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary active:scale-95"
                  />
                  <MatchActionForm
                    action={respondToInvitation}
                    hiddenFields={{
                      participantId: invitation.participantId,
                      matchId: invitation.match.id,
                      accept: "false",
                    }}
                    label="Rechazar"
                    pendingLabel="Rechazando…"
                    className="rounded-lg border border-outline-variant px-3 py-1.5 font-label text-xs font-bold text-on-surface active:scale-95"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
