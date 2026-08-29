"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  AddCourtManagerFormSchema,
  RegisterCourtPaymentFormSchema,
  SetCourtPlanFormSchema,
  type AddCourtManagerFormState,
  type RegisterCourtPaymentFormState,
  type SetCourtPlanFormState,
} from "@/lib/billing/definitions";

/**
 * Admin-only: fija o renueva el plan de una cancha. Es un upsert sobre
 * `court_subscriptions` (única fila por cancha, ver migración `court_billing_plans`) —
 * el trigger `court_subscriptions_sync` recalcula `courts.is_official`/`sponsored_until`
 * solo, no hay nada más que tocar acá. `canceled_at` se limpia siempre: si la cancha
 * estaba cancelada y el admin vuelve a fijarle un plan, reactivarla es la intención obvia.
 */
export async function setCourtPlan(
  courtId: string,
  _state: SetCourtPlanFormState,
  formData: FormData,
): Promise<SetCourtPlanFormState> {
  const session = await requireAdmin();

  const validatedFields = SetCourtPlanFormSchema.safeParse({
    plan: formData.get("plan"),
    currentPeriodEnd: formData.get("currentPeriodEnd"),
    graceDays: formData.get("graceDays"),
    priceUsd: formData.get("priceUsd"),
    notes: formData.get("notes"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { plan, currentPeriodEnd, graceDays, priceUsd, notes } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.from("court_subscriptions").upsert(
    {
      court_id: courtId,
      plan,
      current_period_end: new Date(currentPeriodEnd).toISOString(),
      grace_days: graceDays,
      price_usd: priceUsd ?? null,
      notes: notes || null,
      canceled_at: null,
      updated_by: session.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "court_id" },
  );

  if (error) {
    return { message: "No se pudo guardar el plan. Intenta de nuevo." };
  }

  revalidatePath(`/admin/canchas/${courtId}/editar`);
  revalidatePath("/admin/canchas");
  revalidatePath("/admin");

  return { success: "Plan actualizado." };
}

/** Admin-only: cancela el plan de una cancha ahora mismo (no espera a que venza el período). */
export async function cancelCourtPlan(courtId: string) {
  const session = await requireAdmin();

  const supabase = await createClient();
  await supabase
    .from("court_subscriptions")
    .update({ canceled_at: new Date().toISOString(), updated_by: session.userId })
    .eq("court_id", courtId);

  revalidatePath(`/admin/canchas/${courtId}/editar`);
  revalidatePath("/admin/canchas");
  revalidatePath("/admin");
}

/**
 * Admin-only: registra un cobro manual recibido (Pago Móvil/Zelle) en la bitácora
 * `court_payments`. Es solo un registro histórico — no toca `court_subscriptions` por
 * sí solo; el admin sigue usando `setCourtPlan` para extender el período cubierto.
 */
export async function registerCourtPayment(
  courtId: string,
  _state: RegisterCourtPaymentFormState,
  formData: FormData,
): Promise<RegisterCourtPaymentFormState> {
  const session = await requireAdmin();

  const validatedFields = RegisterCourtPaymentFormSchema.safeParse({
    plan: formData.get("plan"),
    amountUsd: formData.get("amountUsd"),
    coversUntil: formData.get("coversUntil"),
    method: formData.get("method"),
    reference: formData.get("reference"),
    note: formData.get("note"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { plan, amountUsd, coversUntil, method, reference, note } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.from("court_payments").insert({
    court_id: courtId,
    plan,
    amount_usd: amountUsd,
    covers_until: new Date(coversUntil).toISOString(),
    method: method || null,
    reference: reference || null,
    note: note || null,
    created_by: session.userId,
  });

  if (error) {
    return { message: "No se pudo registrar el pago. Intenta de nuevo." };
  }

  revalidatePath(`/admin/canchas/${courtId}/editar`);

  return { success: "Cobro registrado." };
}

/** Admin-only: vincula un usuario ya existente como dueño/manager de una cancha. */
export async function addCourtManager(
  courtId: string,
  _state: AddCourtManagerFormState,
  formData: FormData,
): Promise<AddCourtManagerFormState> {
  await requireAdmin();

  const validatedFields = AddCourtManagerFormSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("court_managers").insert({
    court_id: courtId,
    user_id: validatedFields.data.userId,
    role: validatedFields.data.role,
  });

  if (error) {
    // Violación del único (court_id, user_id) más probable causa: ya está vinculado.
    return { message: "No se pudo vincular. ¿Ya es manager de esta cancha?" };
  }

  revalidatePath(`/admin/canchas/${courtId}/editar`);
}

/** Admin-only: desvincula a un manager de una cancha. */
export async function removeCourtManager(managerId: string, courtId: string) {
  await requireAdmin();

  const supabase = await createClient();
  await supabase.from("court_managers").delete().eq("id", managerId);

  revalidatePath(`/admin/canchas/${courtId}/editar`);
}
