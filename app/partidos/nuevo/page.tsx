import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile, getCourts } from "@/lib/auth/dal";
import { CreateMatchForm } from "./create-match-form";

export default async function NuevoPartidoPage({
  searchParams,
}: {
  searchParams: Promise<{ courtId?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const { courtId } = await searchParams;
  const courts = await getCourts();
  const initialCourt = courtId ? courts.find((c) => c.id === courtId) : undefined;

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-6 font-display text-2xl font-bold">Armar partido</h1>

      {courts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center font-body text-on-surface-variant">
          Todavía no hay canchas disponibles. Pronto el administrador cargará canchas.
        </p>
      ) : (
        <CreateMatchForm
          courts={courts}
          preferredSports={profile.sport_preferences}
          initialCourt={initialCourt}
        />
      )}
    </div>
  );
}
