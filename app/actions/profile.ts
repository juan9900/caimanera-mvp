"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  OnboardingFormSchema,
  NotificationScopesSchema,
  type OnboardingFormState,
} from "@/lib/auth/definitions";

export async function completeOnboarding(
  _state: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const session = await requireSession();

  const validatedFields = OnboardingFormSchema.safeParse({
    name: formData.get("name"),
    zone: formData.get("zone"),
    sportPreferences: formData.getAll("sportPreferences"),
    vibe: formData.get("vibe"),
    notificationScopes: formData.getAll("notificationScopes"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, zone, sportPreferences, vibe, notificationScopes } =
    validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      name,
      zone,
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
