import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile, getNotifications } from "@/lib/auth/dal";
import { NotificationsList } from "@/components/notifications/notifications-list";

export default async function NotificationsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const notifications = await getNotifications();

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-2 font-display text-2xl font-bold">Notificaciones</h1>
      <p className="mb-6 font-body text-on-surface-variant">
        Solicitudes y novedades de tus partidos, amigos y grupos.
      </p>

      <NotificationsList notifications={notifications} />
    </div>
  );
}
