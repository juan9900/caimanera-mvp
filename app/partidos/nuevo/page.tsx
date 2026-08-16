import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile, getCourts } from "@/lib/auth/dal";
import { CreateMatchForm } from "./create-match-form";

export default async function NuevoPartidoPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const courts = await getCourts();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
          Armar partido
        </h1>

        {courts.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-500">
            Todavía no hay canchas cargadas. Agrega una cancha primero.
          </p>
        ) : (
          <CreateMatchForm courts={courts} />
        )}
      </div>
    </div>
  );
}
