"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

/** Marks every unread notification of the current user as read. */
export async function markAllNotificationsRead(): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", session.userId)
    .is("read_at", null);

  revalidatePath("/notificaciones");
}

/** Marks a single notification as read — called when its link is opened. */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", session.userId);
}
