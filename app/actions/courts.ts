"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  AddCourtFormSchema,
  type AddCourtFormState,
} from "@/lib/courts/definitions";

export async function createCourt(
  _state: AddCourtFormState,
  formData: FormData
): Promise<AddCourtFormState> {
  const session = await requireAdmin();

  const validatedFields = AddCourtFormSchema.safeParse({
    name: formData.get("name"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    contactPhone: formData.get("contactPhone"),
    schedule: formData.get("schedule"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, lat, lng, contactPhone, schedule } = validatedFields.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courts")
    .insert({
      name,
      lat,
      lng,
      contact_phone: contactPhone || null,
      schedule: schedule || null,
      added_by: session.userId,
      is_official: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { message: "No se pudo agregar la cancha. Intenta de nuevo." };
  }

  redirect(`/admin/canchas`);
}
