import Link from "next/link";
import {
  verifySession,
  getCurrentUserProfile,
  getIncomingFriendRequests,
  getUnreadNotificationCount,
} from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { HeaderNav } from "@/components/header-nav";
import { SiteLogo } from "@/components/site-logo";

export async function SiteHeader() {
  const session = await verifySession();
  const profile = session ? await getCurrentUserProfile() : null;
  const friendRequestCount = session ? (await getIncomingFriendRequests()).length : 0;
  const unreadNotificationCount = session ? await getUnreadNotificationCount() : 0;

  return (
    <header className="relative flex items-center justify-between border-b border-outline-variant bg-surface px-6 py-3 text-on-surface">
      <Link href="/" aria-label="Kancha">
        <SiteLogo className="h-8 w-auto" priority />
      </Link>
      <HeaderNav
        authed={!!session}
        userLabel={session ? (profile?.name ?? session.email ?? undefined) : undefined}
        isAdmin={profile?.is_admin ?? false}
        friendRequestCount={friendRequestCount}
        unreadNotificationCount={unreadNotificationCount}
        logout={session ? logout : undefined}
      />
    </header>
  );
}
