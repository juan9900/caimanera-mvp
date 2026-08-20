import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { notifyUsers } from "@/lib/push/send";

type Client = SupabaseClient<Database>;

/**
 * Copy and recipient lookup for the group-invite push, kept out of
 * `app/actions/groups.ts` so the action stays about the write it performs.
 * Best-effort like the match notifications: runs after the insert already
 * succeeded and never throws.
 */

/** A member invited someone to their group. */
export async function notifyGroupInvited(
  supabase: Client,
  userIds: string[],
  groupName: string,
  inviterName: string | null
): Promise<void> {
  await notifyUsers(supabase, userIds, {
    title: "Te invitaron a un grupo",
    body: `${inviterName ?? "Un jugador"} te invitó al grupo ${groupName}.`,
    url: "/invitaciones",
  });
}
