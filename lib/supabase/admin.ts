import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role client. Bypasses RLS entirely, so it exists for exactly one
 * reason: push delivery has to read `push_subscriptions` rows belonging to
 * *other* users, which the request-scoped client in `server.ts` can't do.
 *
 * The alternative — a `SECURITY DEFINER` function returning subscriptions for
 * arbitrary user ids — would have to be executable by `authenticated`, which
 * hands every logged-in user the push keys of everyone else. Keeping the
 * privilege on a server-only key is the narrower blast radius.
 *
 * Returns `null` when the key isn't configured so callers degrade to "no
 * notifications" instead of crashing.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
