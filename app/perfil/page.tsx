import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile } from "@/lib/auth/dal";
import { NotificationPreferences } from "@/components/notification-preferences";

export default async function PerfilPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/onboarding");

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-2 font-display text-2xl font-bold">Mi perfil</h1>
      <p className="mb-8 font-body text-on-surface-variant">
        {profile.name ?? session.email} · {profile.zone ?? "Sin zona"}
      </p>

      <NotificationPreferences initialScopes={profile.notification_scopes} />
    </div>
  );
}
