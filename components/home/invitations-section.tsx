import Link from "next/link";
import { respondToInvitation } from "@/app/actions/matches";
import { MatchActionForm } from "@/components/match-action-form";
import { MatchCard } from "@/components/home/match-card";
import type { MatchInvitation } from "@/lib/auth/dal";

/**
 * "Invitaciones" section: private matches a friend invited the current user
 * to, above "De tus amigos". Accepting confirms the slot directly (no
 * organizer approval — see `respondToInvitation`). Renders nothing when
 * empty, same as `FriendsMatches`, so it never clutters the home.
 */
export function InvitationsSection({
  invitations,
  distanceByCourtId,
}: {
  invitations: MatchInvitation[];
  distanceByCourtId?: Map<string, string>;
}) {
  if (invitations.length === 0) return null;

  return (
    <section className="px-4 py-2">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-on-surface">Invitaciones</h2>
        <Link
          href="/invitaciones"
          className="font-label text-xs font-bold uppercase tracking-wider text-primary-lime"
        >
          Ver todas
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {invitations.map((invitation) => (
          <li key={invitation.participantId} className="flex flex-col gap-2">
            <MatchCard
              match={invitation.match}
              distanceLabel={
                invitation.match.court
                  ? distanceByCourtId?.get(invitation.match.court.id)
                  : undefined
              }
              hideBadgeWhenFull
            />
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
    </section>
  );
}
