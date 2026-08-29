import { verifySession } from "@/lib/auth/dal";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";

/** Chrome for the product surface: header + bottom tab bar. Kept out of /admin. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  return (
    <div className={`flex min-h-screen flex-col ${session ? "pb-20" : ""}`}>
      <SiteHeader />
      {children}
      <BottomNav />
    </div>
  );
}
