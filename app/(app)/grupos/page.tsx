import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession, getCurrentUserProfile, getMyGroups } from "@/lib/auth/dal";
import { CreateGroupForm } from "@/components/groups/create-group-form";

export default async function GroupsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const groups = await getMyGroups();

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-2 font-display text-2xl font-bold">Mis grupos</h1>
      <p className="mb-6 font-body text-on-surface-variant">
        Junta a tus amigos en grupos para invitarlos a todos de un toque cuando
        organices un partido.
      </p>

      <section className="mb-8">
        <CreateGroupForm />
      </section>

      <ul className="flex flex-col gap-2">
        {groups.length === 0 && (
          <li className="rounded-xl border border-dashed border-surface-variant px-4 py-6 text-center font-body text-sm text-on-surface-variant">
            Todavía no tienes grupos. Crea uno arriba.
          </li>
        )}
        {groups.map(({ group, memberCount, isOwner }) => (
          <li key={group.id}>
            <Link
              href={`/grupos/${group.id}`}
              className="flex items-center justify-between rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3"
            >
              <div>
                <p className="font-body text-on-surface">{group.name}</p>
                <p className="font-body text-sm text-on-surface-variant">
                  {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
                </p>
              </div>
              {isOwner && (
                <span className="shrink-0 rounded-full bg-secondary-container/30 px-2 py-0.5 font-label text-xs font-bold text-on-secondary-container">
                  Creador
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
