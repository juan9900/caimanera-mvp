"use server";

import { revalidatePath } from "next/cache";
import { requireSession, searchUsers, type UserSearchResult } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  SendFriendRequestSchema,
  type FriendActionResult,
} from "@/lib/friends/definitions";

/** Searches other users by name/phone for the "buscar y agregar" panel. */
export async function searchUsersAction(query: string): Promise<UserSearchResult[]> {
  return searchUsers(query);
}

/** Sends a friend request to another user. */
export async function sendFriendRequest(formData: FormData): Promise<FriendActionResult> {
  const session = await requireSession();

  const validatedFields = SendFriendRequestSchema.safeParse({
    addresseeId: formData.get("addresseeId"),
  });
  if (!validatedFields.success) {
    return { message: "Usuario inválido." };
  }
  const { addresseeId } = validatedFields.data;

  if (addresseeId === session.userId) {
    return { message: "No puedes agregarte a ti mismo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("friendships").insert({
    requester_id: session.userId,
    addressee_id: addresseeId,
    status: "pendiente",
  });

  if (error) {
    if (error.code === "23505") {
      return { message: "Ya existe una solicitud o amistad con este usuario." };
    }
    return { message: "No se pudo enviar la solicitud. Intenta de nuevo." };
  }

  revalidatePath("/red");
}

/** Accepts a friend request sent to the current user. */
export async function acceptFriendRequest(formData: FormData): Promise<FriendActionResult> {
  const session = await requireSession();
  const friendshipId = formData.get("friendshipId");
  if (typeof friendshipId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: "aceptada", responded_at: new Date().toISOString() })
    .eq("id", friendshipId)
    .eq("addressee_id", session.userId);

  if (error) return { message: "No se pudo aceptar la solicitud. Intenta de nuevo." };

  revalidatePath("/red");
}

/** Rejects a friend request sent to the current user. */
export async function rejectFriendRequest(formData: FormData): Promise<FriendActionResult> {
  const session = await requireSession();
  const friendshipId = formData.get("friendshipId");
  if (typeof friendshipId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: "rechazada", responded_at: new Date().toISOString() })
    .eq("id", friendshipId)
    .eq("addressee_id", session.userId);

  if (error) return { message: "No se pudo rechazar la solicitud. Intenta de nuevo." };

  revalidatePath("/red");
}

/** Cancels a friend request the current user sent. */
export async function cancelFriendRequest(formData: FormData): Promise<FriendActionResult> {
  const session = await requireSession();
  const friendshipId = formData.get("friendshipId");
  if (typeof friendshipId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("requester_id", session.userId);

  if (error) return { message: "No se pudo cancelar la solicitud. Intenta de nuevo." };

  revalidatePath("/red");
}

/** Removes an accepted friendship (either side can trigger it). */
export async function removeFriend(formData: FormData): Promise<FriendActionResult> {
  const session = await requireSession();
  const friendshipId = formData.get("friendshipId");
  if (typeof friendshipId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${session.userId},addressee_id.eq.${session.userId}`);

  if (error) return { message: "No se pudo eliminar la amistad. Intenta de nuevo." };

  revalidatePath("/red");
}
