import { redirect } from "next/navigation";
import { MapPin, Flame, Coffee } from "lucide-react";
import { verifySession, getCurrentUserProfile } from "@/lib/auth/dal";
import { NotificationPreferences } from "@/components/notification-preferences";
import { SPORT_LABELS, VIBE_LABELS } from "@/lib/matches/home";

const VIBE_ICON = {
  relajado: Coffee,
  competitivo: Flame,
} as const;

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

  const VibeIcon = VIBE_ICON[profile.vibe] ?? Coffee;

  return (
    <div className="flex flex-1 flex-col gap-6 bg-surface px-4 py-6 text-on-surface">
      <section className="overflow-hidden rounded-2xl border border-surface-variant/50 bg-surface-container">
        <div className="h-16 bg-gradient-to-r from-secondary-container to-primary-lime/20" />
        <div className="px-5 pb-5">
          <div className="-mt-8 flex items-end gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-surface-container bg-primary-lime font-display text-xl font-bold text-on-primary">
              {initials(profile.name)}
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="truncate font-display text-xl font-bold">
                {profile.name ?? session.email}
              </h1>
              {profile.zone && (
                <p className="flex items-center gap-1 font-body text-sm text-on-surface-variant">
                  <MapPin size={14} className="shrink-0" />
                  {profile.zone}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-primary-lime/40 bg-primary-lime/10 px-3 py-1 font-label text-xs font-bold text-primary-lime">
              <VibeIcon size={13} />
              {VIBE_LABELS[profile.vibe] ?? profile.vibe}
            </span>
            {profile.sport_preferences.map((sport) => (
              <span
                key={sport}
                className="rounded-full border border-surface-variant px-3 py-1 font-label text-xs font-bold text-on-surface-variant"
              >
                {SPORT_LABELS[sport] ?? sport}
              </span>
            ))}
          </div>
        </div>
      </section>

      <NotificationPreferences initialScopes={profile.notification_scopes} />
    </div>
  );
}
