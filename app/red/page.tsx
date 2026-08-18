import { redirect } from "next/navigation";
import {
  verifySession,
  getCurrentUserProfile,
  getMyInvitees,
  getMyInviter,
} from "@/lib/auth/dal";
import { CopyInviteLink } from "@/components/copy-invite-link";

export default async function RedPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const [invitees, inviter] = await Promise.all([
    getMyInvitees(),
    getMyInviter(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-2 font-display text-2xl font-bold">Mi red</h1>
      <p className="mb-6 font-body text-on-surface-variant">
        Tu red directa influye en qué partidos ves confirmados de una y
        cuáles quedan pendientes de aprobación.
      </p>

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
        <CopyInviteLink referralCode={profile.referral_code} />
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
