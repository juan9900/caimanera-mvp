import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession, getCurrentUserProfile } from "@/lib/auth/dal";

export default async function Home() {
  const session = await verifySession();
  const profile = session ? await getCurrentUserProfile() : null;

  if (session && !profile?.name) redirect("/onboarding");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Caimanera
      </h1>
      <p className="mt-3 max-w-md text-lg text-zinc-600">
        Consigue jugadores para tu próxima caimanera en Maracaibo.
      </p>

      {profile ? (
        <div className="mt-6 text-zinc-700">
          <p>¡Bienvenido de vuelta, {profile.name}!</p>
          <p className="mt-2">
            Todavía no hay partidos, pero ya puedes{" "}
            <Link href="/canchas" className="font-medium text-green-700 hover:underline">
              ver las canchas
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 flex gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Iniciar sesión
          </Link>
        </div>
      )}
    </div>
  );
}
