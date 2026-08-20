import {
  verifySession,
  getCurrentUserProfile,
  getMyInvitations,
  getIncomingFriendRequests,
} from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { HeaderNav } from "@/components/header-nav";
import { LocationSelector } from "@/components/location/location-selector";

export async function SiteHeader() {
  const session = await verifySession();
  const profile = session ? await getCurrentUserProfile() : null;
  const [invitationCount, friendRequestCount] = session
    ? await Promise.all([
        getMyInvitations().then((invitations) => invitations.length),
        getIncomingFriendRequests().then((requests) => requests.length),
      ])
    : [0, 0];

  return (
    <header className="relative flex items-center justify-between border-b border-outline-variant bg-surface px-6 py-3 text-on-surface">
      <LocationSelector authed={!!session} initialLabel={profile?.location_label ?? null} />
      <HeaderNav
        authed={!!session}
        userLabel={session ? (profile?.name ?? session.email ?? undefined) : undefined}
        isAdmin={profile?.is_admin ?? false}
        invitationCount={invitationCount}
        friendRequestCount={friendRequestCount}
        logout={session ? logout : undefined}
      />
    </header>
  );
}
