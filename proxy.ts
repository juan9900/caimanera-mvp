import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: `middleware.ts` is deprecated in favor of `proxy.ts`. This only
// refreshes the Supabase session cookie (optimistic, cookie-read only — no DB
// calls here per the framework's auth guide). Route protection is enforced
// per Server Action/Route Handler via the DAL (lib/auth/dal.ts), not here.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)",
  ],
};
