import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { verifySession, getCurrentUserProfile } from "@/lib/auth/dal";
import { NotificationPreferences } from "@/components/notification-preferences";
import { EditProfileSection } from "@/components/profile/edit-profile-section";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function PerfilPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/onboarding");

  return (
    <div className="flex flex-1 flex-col gap-6 bg-surface px-4 py-6 text-on-surface">
      <section className="overflow-hidden rounded-2xl border border-surface-variant/50 bg-surface-container">
        <div className="h-16 bg-gradient-to-r from-secondary-container to-primary-lime/20" />
        <div className="px-5 pb-5">
          <div className="flex items-start gap-4">
            <div className="-mt-12 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-surface-container bg-primary-lime font-display text-xl font-bold text-on-primary">
              {initials(profile.name)}
            </div>
            <div className="-mt-14 min-w-0 pt-1">
              <h1 className="truncate font-display text-xl font-bold">
                {profile.name ?? session.email}
              </h1>
              {profile.location_label && (
                <p className="flex items-center gap-1 font-body text-sm text-on-surface-variant">
                  <MapPin size={14} className="shrink-0" />
                  {profile.location_label}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <EditProfileSection
        initialLocation={
          profile.location_label && profile.location_lat != null && profile.location_lng != null
            ? { label: profile.location_label, lat: profile.location_lat, lng: profile.location_lng }
            : null
        }
        initialVibe={profile.vibe}
        initialSports={profile.sport_preferences}
      />

      <NotificationPreferences initialScopes={profile.notification_scopes} />
    </div>
  );
}
