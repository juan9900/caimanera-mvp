import { redirect } from "next/navigation";
import Link from "next/link";
import {
  verifySession,
  getCurrentUserProfile,
  getMyInvitees,
  getMyInviter,
} from "@/lib/auth/dal";

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
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Mi red
        </h1>
        <p className="mb-6 text-zinc-600">
          Tu red directa influye en qué partidos ves confirmados de una y
          cuáles quedan pendientes de aprobación.
        </p>

        <section className="mb-8">
          <h2 className="mb-2 text-sm font-medium text-zinc-700">
            Quién te invitó
          </h2>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            {inviter ? (
              <p className="text-zinc-900">
                {inviter.name ?? "Jugador"}
                {inviter.zone && (
                  <span className="text-zinc-500"> · {inviter.zone}</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                Entraste como fundador, sin invitación.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-700">
              Quién invitaste ({invitees.length})
            </h2>
            <Link
              href="/invitaciones"
              className="text-sm text-green-700 hover:underline"
            >
              Invitar a alguien
            </Link>
          </div>
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
            {invitees.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">
                Todavía no invitaste a nadie de tu red directa.
              </li>
            )}
            {invitees.map((user) => (
              <li key={user.id} className="px-4 py-3">
                <p className="text-zinc-900">{user.name ?? "Jugador"}</p>
                {user.zone && (
                  <p className="text-sm text-zinc-500">{user.zone}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
