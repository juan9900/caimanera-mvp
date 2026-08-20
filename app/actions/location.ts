"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type LocationCandidate = { label: string; lat: number; lng: number };

/** Saves the current user's app-wide location — used to center maps and compute distances. */
export async function setUserLocation(candidate: LocationCandidate): Promise<{ message?: string }> {
  const session = await requireSession();

  if (
    typeof candidate.label !== "string" ||
    !candidate.label.trim() ||
    !Number.isFinite(candidate.lat) ||
    !Number.isFinite(candidate.lng)
  ) {
    return { message: "Selección de ubicación inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      location_label: candidate.label,
      location_lat: candidate.lat,
      location_lng: candidate.lng,
    })
    .eq("id", session.userId);

  if (error) {
    return { message: "No se pudo guardar tu ubicación." };
  }

  revalidatePath("/", "layout");
  return {};
}
