import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile, getMyInvitations } from "@/lib/auth/dal";
import { respondToInvitation } from "@/app/actions/matches";
import { MatchActionForm } from "@/components/match-action-form";
import { MatchCard } from "@/components/home/match-card";

export default async function InvitationsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const invitations = await getMyInvitations();

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-2 font-display text-2xl font-bold">Invitaciones</h1>
      <p className="mb-6 font-body text-on-surface-variant">
        Partidos privados a los que te invitó directamente el organizador.
      </p>

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
    </div>
  );
}
