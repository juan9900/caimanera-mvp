import { verifySession } from "@/lib/auth/dal";
import { BottomNavInner } from "@/components/bottom-nav-inner";

/** Resolves auth state and renders the bottom tab bar only for signed-in users. */
export async function BottomNav() {
  const session = await verifySession();
  if (!session) return null;

  return <BottomNavInner />;
}
