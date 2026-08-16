"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export async function createInvitation() {
  const session = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("invitations")
    .insert({ created_by: session.userId });

  if (error) {
    return { message: "No se pudo generar la invitación. Intenta de nuevo." };
  }

  revalidatePath("/invitaciones");
}
