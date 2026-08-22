import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { notifyAndPersist } from "@/lib/push/send";

type Client = SupabaseClient<Database>;

/**
 * Copy and recipient lookup for the friendship pushes, kept out of
 * `app/actions/friends.ts` so the actions stay about the write they perform.
 * Best-effort like the match/group notifications: runs after the write
 * already succeeded and never throws.
 */

/** Someone sent the current user a friend request. */
export async function notifyFriendRequest(
  supabase: Client,
  addresseeId: string,
  requesterName: string | null,
  requesterId?: string
): Promise<void> {
  await notifyAndPersist(
    supabase,
    [addresseeId],
    {
      title: "Nueva solicitud de amistad",
      body: `${requesterName ?? "Un jugador"} quiere agregarte como amigo.`,
      url: "/amigos",
    },
    "friend_request",
    requesterId
  );
}

/** The addressee accepted a pending friend request. */
export async function notifyFriendAccepted(
  supabase: Client,
  requesterId: string,
  accepterName: string | null,
  accepterId?: string
): Promise<void> {
  await notifyAndPersist(
    supabase,
    [requesterId],
    {
      title: "¡Nueva amistad!",
      body: `${accepterName ?? "Un jugador"} aceptó tu solicitud de amistad.`,
      url: "/amigos",
    },
    "friend_accepted",
    accepterId
  );
}
