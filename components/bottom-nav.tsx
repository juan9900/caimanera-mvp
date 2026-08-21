import { verifySession, getMyInvitations, getMyGroupInvitations } from "@/lib/auth/dal";
import { BottomNavInner } from "@/components/bottom-nav-inner";

/** Resolves auth state and renders the bottom tab bar only for signed-in users. */
export async function BottomNav() {
  const session = await verifySession();
  if (!session) return null;

  const [matchInvitations, groupInvitations] = await Promise.all([
    getMyInvitations(),
    getMyGroupInvitations(),
  ]);
  const invitationCount = matchInvitations.length + groupInvitations.length;

  return <BottomNavInner invitationCount={invitationCount} />;
}
