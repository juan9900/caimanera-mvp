"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  OnboardingFormSchema,
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
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, zone, sportPreferences, vibe } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      name,
      zone,
      sport_preferences: sportPreferences,
      vibe,
    })
    .eq("id", session.userId);

  if (error) {
    return { message: "No se pudo guardar tu perfil. Intenta de nuevo." };
  }

  redirect("/");
}
