"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserProfile, requireSession } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { ConfirmPaymentSchema, ReportPaymentSchema } from "@/lib/payments/definitions";
import { notifyPaymentConfirmed, notifyPaymentReported } from "@/lib/push/payment-notifications";

export type PaymentActionResult = { message: string } | void;

/**
 * A confirmed player reports their Pago Móvil reference. Recuerda: nunca hay
 * transacciones dentro de la app — esto solo deja constancia para que el
 * organizador la verifique por fuera (`report_match_payment`, que también
 * valida que la fila sea `confirmado` y que el partido tenga datos de pago).
 */
export async function reportPayment(formData: FormData): Promise<PaymentActionResult> {
  await requireSession();

  const validatedFields = ReportPaymentSchema.safeParse({
    matchId: formData.get("matchId"),
    reference: formData.get("reference"),
  });

  if (!validatedFields.success) {
    return { message: "Ingresa una referencia válida." };
  }

  const { matchId, reference } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc("report_match_payment", {
    p_match_id: matchId,
    p_reference: reference,
  });

  if (error) return { message: "No se pudo notificar el pago. Intenta de nuevo." };

  const { data: match } = await supabase
    .from("matches")
    .select("organizer_id")
    .eq("id", matchId)
    .maybeSingle();

  if (match) {
    const profile = await getCurrentUserProfile();
    await notifyPaymentReported(supabase, matchId, match.organizer_id, profile?.name ?? null, reference);
  }

  revalidatePath(`/partidos/${matchId}`);
}

/**
 * Organizer confirms (or desmarca) a participant's payment — either because
 * they verified the reported reference, or because the player paid some
 * other way (efectivo, etc.) and this is a manual mark. `confirmed:false`
 * un-marks it, e.g. to correct a mistake.
 */
export async function setPaymentConfirmed(formData: FormData): Promise<PaymentActionResult> {
  await requireSession();

  const validatedFields = ConfirmPaymentSchema.safeParse({
    participantId: formData.get("participantId"),
    matchId: formData.get("matchId"),
    confirmed: formData.get("confirmed"),
  });

  if (!validatedFields.success) {
    return { message: "No se pudo actualizar el pago." };
  }

  const { participantId, matchId, confirmed } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_participant_payment_confirmed", {
    p_participant_id: participantId,
    p_confirmed: confirmed,
  });

  if (error) return { message: "Solo el organizador puede confirmar pagos." };

  if (confirmed) {
    const { data: participant } = await supabase
      .from("match_participants")
      .select("user_id")
      .eq("id", participantId)
      .maybeSingle();

    if (participant) {
      await notifyPaymentConfirmed(supabase, matchId, participant.user_id);
    }
  }

  revalidatePath(`/partidos/${matchId}`);
}
