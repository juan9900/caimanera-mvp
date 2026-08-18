"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  AddCourtFormSchema,
  EditCourtFormSchema,
  type AddCourtFormState,
  type EditCourtFormState,
} from "@/lib/courts/definitions";

/** Shared parsing: pulls the common + sponsorship fields out of a court form's FormData. */
function readCourtFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    contactPhone: formData.get("contactPhone"),
    schedule: formData.get("schedule"),
    logoUrl: formData.get("logoUrl"),
    photosText: formData.get("photosText"),
    whatsappUrl: formData.get("whatsappUrl"),
    bookingUrl: formData.get("bookingUrl"),
    amenities: formData.getAll("amenities"),
    isOfficial: formData.get("isOfficial") === "true",
    sponsoredUntil: formData.get("sponsoredUntil"),
    sponsorPriority: formData.get("sponsorPriority"),
    promoText: formData.get("promoText"),
    promoCode: formData.get("promoCode"),
    promoExpiresAt: formData.get("promoExpiresAt"),
  };
}

/** Shapes validated form fields into the `courts` row shape shared by insert/update. */
function toCourtRow(fields: CourtFormFields) {
  const photos = fields.photosText
    ? fields.photosText.split("\n").map((url) => url.trim()).filter(Boolean)
    : [];

  return {
    name: fields.name,
    lat: fields.lat,
    lng: fields.lng,
    contact_phone: fields.contactPhone || null,
    schedule: fields.schedule || null,
    logo_url: fields.logoUrl || null,
    photos: photos.length > 0 ? photos : null,
    whatsapp_url: fields.whatsappUrl || null,
    booking_url: fields.bookingUrl || null,
    amenities: fields.amenities,
    is_official: fields.isOfficial,
    sponsored_until: fields.sponsoredUntil ? new Date(fields.sponsoredUntil).toISOString() : null,
    sponsor_priority: fields.sponsorPriority,
    promo_text: fields.promoText || null,
    promo_code: fields.promoCode || null,
    promo_expires_at: fields.promoExpiresAt ? new Date(fields.promoExpiresAt).toISOString() : null,
  };
}

type CourtFormFields = ReturnType<typeof AddCourtFormSchema.parse>;

export async function createCourt(
  _state: AddCourtFormState,
  formData: FormData
): Promise<AddCourtFormState> {
  const session = await requireAdmin();

  const validatedFields = AddCourtFormSchema.safeParse(readCourtFormData(formData));

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courts")
    .insert({ ...toCourtRow(validatedFields.data), added_by: session.userId })
    .select("id")
    .single();

  if (error || !data) {
    return { message: "No se pudo agregar la cancha. Intenta de nuevo." };
  }

  redirect(`/admin/canchas`);
}

export async function updateCourt(
  courtId: string,
  _state: EditCourtFormState,
  formData: FormData
): Promise<EditCourtFormState> {
  await requireAdmin();

  const validatedFields = EditCourtFormSchema.safeParse(readCourtFormData(formData));

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courts")
    .update(toCourtRow(validatedFields.data))
    .eq("id", courtId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { message: "No se pudo guardar la cancha. Intenta de nuevo." };
  }

  redirect(`/admin/canchas`);
}
