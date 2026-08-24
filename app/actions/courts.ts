"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  AddCourtFormSchema,
  AddPendingCourtFormSchema,
  EditCourtFormSchema,
  type AddCourtFormState,
  type AddPendingCourtFormState,
  type EditCourtFormState,
} from "@/lib/courts/definitions";

/** Shared parsing: pulls the common + sponsorship fields out of a court form's FormData. */
function readCourtFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    address: formData.get("address"),
    contactPhone: formData.get("contactPhone"),
    schedule: formData.get("schedule"),
    logoUrl: formData.get("logoUrl"),
    photosText: formData.get("photosText"),
    whatsappUrl: formData.get("whatsappUrl"),
    bookingUrl: formData.get("bookingUrl"),
    amenities: formData.getAll("amenities"),
    sports: formData.getAll("sports"),
    isOfficial: formData.get("isOfficial") === "true",
    isPublic: formData.get("isPublic") === "true",
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
    address: fields.address || null,
    contact_phone: fields.contactPhone || null,
    schedule: fields.schedule || null,
    logo_url: fields.logoUrl || null,
    photos: photos.length > 0 ? photos : null,
    whatsapp_url: fields.whatsappUrl || null,
    booking_url: fields.bookingUrl || null,
    amenities: fields.amenities,
    sports: fields.sports,
    is_official: fields.isOfficial,
    is_public: fields.isPublic,
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

/**
 * Any signed-in user can add a place that isn't in the catalog — name + a
 * point picked on the map. It's created right away as a court with
 * `verified: false`, usable immediately by its creator (e.g. to pick it for
 * a match), but hidden from everyone else's map/pickers until an admin
 * verifies it in `/admin/sugerencias`. Returns the created court so the
 * caller can select it without a round-trip refetch.
 */
export async function createPendingCourt(
  _state: AddPendingCourtFormState,
  formData: FormData
): Promise<AddPendingCourtFormState> {
  const session = await requireSession();

  const validatedFields = AddPendingCourtFormSchema.safeParse({
    name: formData.get("name"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    reference: formData.get("reference"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courts")
    .insert({
      name: validatedFields.data.name,
      lat: validatedFields.data.lat,
      lng: validatedFields.data.lng,
      address: validatedFields.data.reference || null,
      sports: [],
      is_official: false,
      is_public: true,
      verified: false,
      added_by: session.userId,
    })
    .select("id, name, lat, lng, sports")
    .single();

  if (error || !data) {
    return { message: "No se pudo agregar el lugar. Intenta de nuevo." };
  }

  return {
    success: true,
    message: "¡Listo! Ya puedes usar este lugar. Un admin lo verificará pronto.",
    court: data,
  };
}

/** Admin-only: marks a user-added pending court as verified, making it visible to everyone. */
export async function verifyCourt(courtId: string) {
  await requireAdmin();

  const supabase = await createClient();

  await supabase.from("courts").update({ verified: true }).eq("id", courtId);

  revalidatePath("/admin/sugerencias");
}

/** Admin-only: removes a pending (unverified) court, e.g. a duplicate or bad submission. */
export async function deletePendingCourt(courtId: string) {
  await requireAdmin();

  const supabase = await createClient();

  await supabase.from("courts").delete().eq("id", courtId).eq("verified", false);

  revalidatePath("/admin/sugerencias");
}
