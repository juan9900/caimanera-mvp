import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession, getCurrentUserProfile, getOpenMatches } from "@/lib/auth/dal";

const SPORT_LABELS: Record<string, string> = { futbol: "Fútbol", tenis: "Tenis" };
const VIBE_LABELS: Record<string, string> = {
  relajado: "Relajado",
  competitivo: "Competitivo",
};

export default async function PartidosPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const matches = await getOpenMatches();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Partidos
          </h1>
          <Link
            href="/partidos/nuevo"
            className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            Armar partido
          </Link>
        </div>

        {matches.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-500">
            Todavía no hay partidos abiertos. Arma el primero.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
            {matches.map((match) => (
              <li key={match.id}>
                <Link
                  href={`/partidos/${match.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {match.court?.name ?? "Cancha"} · {SPORT_LABELS[match.sport] ?? match.sport}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {new Date(match.datetime).toLocaleString("es-VE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {VIBE_LABELS[match.vibe]} · organiza {match.organizer?.name ?? "alguien"}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {match.slots_filled}/{match.total_slots}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
