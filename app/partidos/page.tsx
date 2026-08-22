import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile, getOpenMatches, getMyInvolvedMatches } from "@/lib/auth/dal";
import { PartidosClient } from "@/components/matches/partidos-client";
import { LocationSelector } from "@/components/location/location-selector";

export default async function PartidosPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const [openMatches, myMatches] = await Promise.all([getOpenMatches(), getMyInvolvedMatches()]);
  // "Explorar" shows matches to discover — drop the ones already covered by
  // "Mis partidos" (organized or joined) so nothing appears twice.
  const otherMatches = openMatches.filter(
    (m) => !myMatches.some((mine) => mine.id === m.id),
  );

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-4 font-display text-2xl font-bold">Partidos</h1>

      <div className="mb-4">
        <LocationSelector authed initialLabel={profile.location_label ?? null} />
      </div>

      <PartidosClient openMatches={otherMatches} myMatches={myMatches} />
    </div>
  );
}
