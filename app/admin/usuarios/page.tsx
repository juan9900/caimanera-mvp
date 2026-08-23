import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession, getCurrentUserProfile, getIsAdmin, getAllUsers } from "@/lib/auth/dal";

export default async function AdminUsuariosPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const users = await getAllUsers();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl">
        <Link href="/admin" className="mb-4 inline-block text-sm text-green-700 hover:underline">
          ← Panel de administrador
        </Link>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
          Usuarios ({users.length})
        </h1>

        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {users.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              Todavía no hay usuarios registrados.
            </li>
          )}
          {users.map((user) => (
            <li key={user.id} className="px-4 py-3">
              <p className="text-zinc-900">
                {user.name ?? "Jugador"}
                {user.is_admin && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-sm text-zinc-500">
                {new Date(user.created_at).toLocaleDateString("es-VE", { dateStyle: "medium" })}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
