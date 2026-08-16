import Link from "next/link";
import { verifySession, getCurrentUserProfile } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { HeaderNav } from "@/components/header-nav";

export async function SiteHeader() {
  const session = await verifySession();
  const profile = session ? await getCurrentUserProfile() : null;

  return (
    <header className="relative flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <Link href="/" className="font-semibold tracking-tight text-zinc-900">
        Caimanera
      </Link>
      <HeaderNav
        authed={!!session}
        userLabel={session ? (profile?.name ?? session.email ?? undefined) : undefined}
        isAdmin={profile?.is_admin ?? false}
        logout={session ? logout : undefined}
      />
    </header>
  );
}
