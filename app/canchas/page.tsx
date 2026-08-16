import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession, getCurrentUserProfile, getCourts } from "@/lib/auth/dal";
import { CourtsMap } from "@/components/courts-map";

export default async function CanchasPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const courts = await getCourts();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Canchas
          </h1>
          <Link
            href="/canchas/nueva"
            className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            Agregar cancha
          </Link>
        </div>

        {courts.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-500">
            Todavía no hay canchas cargadas. Agrega la primera.
          </p>
        ) : (
          <>
            <CourtsMap courts={courts} />

            <ul className="mt-8 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
              {courts.map((court) => (
                <li key={court.id}>
                  <Link
                    href={`/canchas/${court.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
                  >
                    <span className="font-medium text-zinc-900">{court.name}</span>
                    {court.is_official && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Oficial
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
