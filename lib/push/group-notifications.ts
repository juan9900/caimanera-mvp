import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { notifyAndPersist } from "@/lib/push/send";

type Client = SupabaseClient<Database>;

/**
 * Copy and recipient lookup for the group pushes, kept out of
 * `app/actions/groups.ts` so the actions stay about the write they perform.
 * Best-effort like the match notifications: runs after the insert already
 * succeeded and never throws.
 */

/** A member invited someone to their group. */
export async function notifyGroupInvited(
  supabase: Client,
  userIds: string[],
  groupName: string,
  inviterName: string | null,
  inviterId?: string
): Promise<void> {
  await notifyAndPersist(
    supabase,
    userIds,
    {
      title: "Te invitaron a un grupo",
      body: `${inviterName ?? "Un jugador"} te invitó al grupo ${groupName}.`,
      url: "/invitaciones",
    },
    "group_invited",
    inviterId
  );
}

/** Someone accepted an invite (or joined via token) and is now a member. */
export async function notifyGroupJoined(
  supabase: Client,
  ownerId: string,
  groupId: string,
  groupName: string,
  joinerName: string | null,
  joinerId?: string
): Promise<void> {
  await notifyAndPersist(
    supabase,
    [ownerId],
    {
      title: "Se sumó alguien a tu grupo",
      body: `${joinerName ?? "Un jugador"} se unió al grupo ${groupName}.`,
      url: `/grupos/${groupId}`,
    },
    "group_joined",
    joinerId
  );
}
