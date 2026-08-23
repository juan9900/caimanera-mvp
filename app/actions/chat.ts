"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserProfile, requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { SendMessageSchema } from "@/lib/chat/definitions";
import { notifyMatchChat } from "@/lib/push/chat-notifications";

export type ChatActionResult = { message: string } | void;

/**
 * Sends a message to a match's chat. RLS restricts the insert to the match
 * organizer or confirmed participants (`user_is_match_organizer`/
 * `user_is_confirmed_in_match`), so a non-participant's insert simply fails
 * here rather than needing a separate membership check.
 */
export async function sendMatchMessage(formData: FormData): Promise<ChatActionResult> {
  const session = await requireSession();

  const validatedFields = SendMessageSchema.safeParse({
    matchId: formData.get("matchId"),
    body: formData.get("body"),
  });

  if (!validatedFields.success) {
    return { message: "No se pudo enviar el mensaje." };
  }

  const { matchId, body } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.from("chat_messages").insert({
    match_id: matchId,
    user_id: session.userId,
    body,
  });

  if (error) return { message: "No se pudo enviar el mensaje. Intenta de nuevo." };

  const profile = await getCurrentUserProfile();
  await notifyMatchChat(supabase, matchId, session.userId, profile?.name ?? null, body);

  revalidatePath(`/partidos/${matchId}`);
}
