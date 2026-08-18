import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { verifySession, getCurrentUserProfile, getCourts } from "@/lib/auth/dal";
import { CourtsMap } from "@/components/courts-map";

export default async function CanchasPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const courts = await getCourts();

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-4 font-display text-2xl font-bold">Canchas</h1>

      {courts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center font-body text-on-surface-variant">
          Todavía no hay canchas cargadas.
        </p>
      ) : (
        <>
          <CourtsMap courts={courts} />

          <ul className="mt-6 flex flex-col gap-3">
            {courts.map((court) => (
              <li key={court.id}>
                <Link
                  href={`/canchas/${court.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-surface-variant/50 bg-surface-container p-4 transition-transform active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2 font-body font-medium text-on-surface">
                    <MapPin aria-hidden size={16} className="text-primary-lime" />
                    {court.name}
                  </span>
                  {court.is_official && (
                    <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 font-label text-xs font-bold text-primary-lime">
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
  );
}
