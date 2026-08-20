import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  verifySession,
  getCurrentUserProfile,
  getMyInvitations,
  getIncomingFriendRequests,
} from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { HeaderNav } from "@/components/header-nav";

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
      <Link href="/" className="flex flex-col leading-tight">
        <span className="font-label text-[11px] font-medium uppercase tracking-wider text-primary-lime">
          Ubicación
        </span>
        <span className="flex items-center gap-1 font-display text-base font-bold">
          Cerca de ti
          <ChevronDown aria-hidden size={16} className="text-primary-lime" />
        </span>
      </Link>
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
