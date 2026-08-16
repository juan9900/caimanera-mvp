import Link from "next/link";
import { verifySession, getCurrentUserProfile } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";

export async function SiteHeader() {
  const session = await verifySession();
  const profile = session ? await getCurrentUserProfile() : null;

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <Link href="/" className="font-semibold tracking-tight text-zinc-900">
        Caimanera
      </Link>

      {session ? (
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/invitaciones" className="text-zinc-700 hover:text-green-700">
            Invitaciones
          </Link>
          <span className="text-zinc-500">{profile?.name ?? session.email}</span>
          <form action={logout}>
            <button type="submit" className="text-zinc-700 hover:text-green-700">
              Cerrar sesión
            </button>
          </form>
        </nav>
      ) : (
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-zinc-700 hover:text-green-700">
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-green-600 px-3 py-1.5 font-medium text-white hover:bg-green-700"
          >
            Crear cuenta
          </Link>
        </nav>
      )}
    </header>
  );
}
