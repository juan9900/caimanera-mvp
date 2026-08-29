import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile, getIsAdmin, getPendingCourts } from "@/lib/auth/dal";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

/**
 * Shell for the whole /admin panel: guards (moved out of every page), sidebar +
 * topbar, light theme deliberately separate from the dark product chrome (see
 * `app/(app)/layout.tsx`). No `SiteHeader`/`BottomNav` here — admin isn't the product.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const pendingCourts = await getPendingCourts();

  return (
    <div className="flex min-h-screen bg-zinc-50 font-body text-zinc-900">
      <AdminSidebar pendingCount={pendingCourts.length} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar userName={profile.name} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
