import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile, getIsAdmin } from "@/lib/auth/dal";
import { AddCourtForm } from "./add-court-form";

export default async function NuevaCanchaPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; lat?: string; lng?: string; suggestionId?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  // Coming from "aprobar" on a user suggestion (`/admin/sugerencias`)
  // prefills the form with the suggested name/point.
  const { name, lat, lng, suggestionId } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Agregar cancha
        </h1>
        <p className="mb-6 text-zinc-600">
          Suma una cancha real donde puedan armar caimaneras.
        </p>

        <AddCourtForm
          initialValues={{ name, lat, lng }}
          suggestionId={suggestionId}
        />
      </div>
    </div>
  );
}
