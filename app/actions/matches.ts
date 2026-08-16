"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  CreateMatchFormSchema,
  type CreateMatchFormState,
} from "@/lib/matches/definitions";

export async function createMatch(
  _state: CreateMatchFormState,
  formData: FormData
): Promise<CreateMatchFormState> {
  const session = await requireSession();

  const validatedFields = CreateMatchFormSchema.safeParse({
    courtId: formData.get("courtId"),
    sport: formData.get("sport"),
    datetime: formData.get("datetime"),
    vibe: formData.get("vibe"),
    totalSlots: formData.get("totalSlots"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { courtId, sport, datetime, vibe, totalSlots } = validatedFields.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .insert({
      court_id: courtId,
      sport,
      datetime: datetime.toISOString(),
      vibe,
      total_slots: totalSlots,
      organizer_id: session.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { message: "No se pudo crear el partido. Intenta de nuevo." };
  }

  redirect(`/partidos/${data.id}`);
}

/** Joins the current user into a match, as direct network or external, per `is_direct_network`. */
export async function joinMatch(formData: FormData) {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  if (typeof matchId !== "string") return;

  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("organizer_id")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return;

  const { data: isDirectNetwork } = await supabase.rpc("is_direct_network", {
    organizer: match.organizer_id,
    candidate: session.userId,
  });

  await supabase.from("match_participants").insert(
    isDirectNetwork
      ? { match_id: matchId, user_id: session.userId, status: "confirmado", joined_via: "red_directa" }
      : { match_id: matchId, user_id: session.userId, status: "pendiente", joined_via: "externo" }
  );

  revalidatePath(`/partidos/${matchId}`);
}

/** Removes the current user's own participation from a match. */
export async function leaveMatch(formData: FormData) {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  if (typeof matchId !== "string") return;

  const supabase = await createClient();
  await supabase
    .from("match_participants")
    .delete()
    .eq("match_id", matchId)
    .eq("user_id", session.userId);

  revalidatePath(`/partidos/${matchId}`);
}

/** Organizer approves or rejects a pending join request. */
export async function respondToRequest(formData: FormData) {
  await requireSession();
  const participantId = formData.get("participantId");
  const matchId = formData.get("matchId");
  const approve = formData.get("approve") === "true";
  if (typeof participantId !== "string" || typeof matchId !== "string") return;

  const supabase = await createClient();
  await supabase
    .from("match_participants")
    .update({ status: approve ? "confirmado" : "rechazado" })
    .eq("id", participantId);

  revalidatePath(`/partidos/${matchId}`);
}

/** Organizer removes a participant from a match. */
export async function removeParticipant(formData: FormData) {
  await requireSession();
  const participantId = formData.get("participantId");
  const matchId = formData.get("matchId");
  if (typeof participantId !== "string" || typeof matchId !== "string") return;

  const supabase = await createClient();
  await supabase.from("match_participants").delete().eq("id", participantId);

  revalidatePath(`/partidos/${matchId}`);
}

/** Organizer cancels their own match. */
export async function cancelMatch(formData: FormData) {
  const session = await requireSession();
  const matchId = formData.get("matchId");
  if (typeof matchId !== "string") return;

  const supabase = await createClient();
  await supabase
    .from("matches")
    .update({ status: "cancelado" })
    .eq("id", matchId)
    .eq("organizer_id", session.userId);

  revalidatePath(`/partidos/${matchId}`);
}
