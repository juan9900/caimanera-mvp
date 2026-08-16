import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile } from "@/lib/auth/dal";
import { NotificationPreferences } from "@/components/notification-preferences";

export default async function PerfilPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/onboarding");

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
        Mi perfil
      </h1>
      <p className="mb-8 text-zinc-600">
        {profile.name ?? session.email} · {profile.zone ?? "Sin zona"}
      </p>

      <NotificationPreferences initialScopes={profile.notification_scopes} />
    </div>
  );
}
