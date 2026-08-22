"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  OnboardingFormSchema,
  NotificationScopesSchema,
  ProfileEditSchema,
  type OnboardingFormState,
} from "@/lib/auth/definitions";

export async function completeOnboarding(
  _state: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const session = await requireSession();

  const validatedFields = OnboardingFormSchema.safeParse({
    name: formData.get("name"),
    locationLabel: formData.get("locationLabel"),
    locationLat: formData.get("locationLat"),
    locationLng: formData.get("locationLng"),
    sportPreferences: formData.getAll("sportPreferences"),
    vibe: formData.get("vibe"),
    notificationScopes: formData.getAll("notificationScopes"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, locationLabel, locationLat, locationLng, sportPreferences, vibe, notificationScopes } =
    validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      name,
      location_label: locationLabel,
      location_lat: locationLat,
      location_lng: locationLng,
      sport_preferences: sportPreferences,
      vibe,
      notification_scopes: notificationScopes,
    })
    .eq("id", session.userId);

  if (error) {
    return { message: "No se pudo guardar tu perfil. Intenta de nuevo." };
  }

  redirect("/");
}

/** Marks the interactive home tour as seen, so it doesn't run again. */
export async function completeOnboardingTour(): Promise<{ message?: string }> {
  const session = await requireSession();

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ onboarding_tour_completed: true })
    .eq("id", session.userId);

  if (error) {
    return { message: "No se pudo guardar el progreso del tutorial." };
  }

  return {};
}

/** Updates the current user's notification audience preferences. */
export async function updateNotificationScopes(
  scopes: string[]
): Promise<{ message?: string }> {
  const session = await requireSession();

  const parsed = NotificationScopesSchema.safeParse(scopes);
  if (!parsed.success) {
    return { message: "Selección de notificaciones inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ notification_scopes: parsed.data })
    .eq("id", session.userId);

  if (error) {
    return { message: "No se pudieron guardar tus preferencias." };
  }

  revalidatePath("/perfil");
  return {};
}

/**
 * Updates the current user's location, vibe and favorite sports —
 * everything editable from `/perfil` besides `name`. The location here is
 * the same `location_label`/`location_lat`/`location_lng` used app-wide to
 * center maps and compute distances (`setUserLocation` in
 * `app/actions/location.ts`), so this is the single place that sets it —
 * changing it from `/perfil` updates the map/distance everywhere, and
 * vice versa (both write the same columns and both revalidate the whole
 * layout).
 */
export async function updateProfile(input: {
  location: { label: string; lat: number; lng: number };
  vibe: string;
  sportPreferences: string[];
}): Promise<{ message?: string }> {
  const session = await requireSession();

  const parsed = ProfileEditSchema.safeParse(input);
  if (!parsed.success) {
    return { message: "No se pudo guardar tu perfil. Revisa los datos e intenta de nuevo." };
  }

  const { location, vibe, sportPreferences } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      location_label: location.label,
      location_lat: location.lat,
      location_lng: location.lng,
      vibe,
      sport_preferences: sportPreferences,
    })
    .eq("id", session.userId);

  if (error) {
    return { message: "No se pudo guardar tu perfil. Intenta de nuevo." };
  }

  revalidatePath("/", "layout");
  return {};
}
