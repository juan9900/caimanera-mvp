import { verifySession, getCurrentUserProfile, getIncomingFriendRequests } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { HeaderNav } from "@/components/header-nav";
import { LocationSelector } from "@/components/location/location-selector";

export async function SiteHeader() {
  const session = await verifySession();
  const profile = session ? await getCurrentUserProfile() : null;
  const friendRequestCount = session ? (await getIncomingFriendRequests()).length : 0;

  return (
    <header className="relative flex items-center justify-between border-b border-outline-variant bg-surface px-6 py-3 text-on-surface">
      <LocationSelector authed={!!session} initialLabel={profile?.location_label ?? null} />
      <HeaderNav
        authed={!!session}
        userLabel={session ? (profile?.name ?? session.email ?? undefined) : undefined}
        isAdmin={profile?.is_admin ?? false}
        friendRequestCount={friendRequestCount}
        logout={session ? logout : undefined}
      />
    </header>
  );
}
