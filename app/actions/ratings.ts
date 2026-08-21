"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type RateCourtResult = { message?: string } | undefined;

/**
 * Sets (or updates) the current user's 1-5 rating for a court. One rating
 * per user per court — a re-rate upserts on the `(court_id, user_id)`
 * unique constraint. The aggregate `courts.rating_avg`/`rating_count` is
 * recomputed by a DB trigger, so callers just revalidate the pages that
 * read it.
 */
export async function rateCourt(courtId: string, rating: number): Promise<RateCourtResult> {
  const session = await requireSession();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { message: "Calificación inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("court_ratings").upsert(
    {
      court_id: courtId,
      user_id: session.userId,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "court_id,user_id" },
  );

  if (error) {
    return { message: "No se pudo guardar tu calificación. Intenta de nuevo." };
  }

  revalidatePath(`/canchas/${courtId}`);
  revalidatePath("/mapa");
}
