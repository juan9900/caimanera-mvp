import * as z from "zod";

/** El jugador notifica el pago de su cupo, dejando la referencia para que el
 * organizador la verifique por fuera de la app (nunca hay transacciones
 * reales aquí — ver `report_match_payment` en la base de datos). */
export const ReportPaymentSchema = z.object({
  matchId: z.uuid({ error: "Partido inválido." }),
  reference: z
    .string()
    .trim()
    .min(1, { error: "Ingresa el número de referencia." })
    .max(40, { error: "La referencia es demasiado larga." }),
});

/** El organizador confirma (o desmarca) el pago de un participante, sea
 * porque verificó la referencia notificada o porque el jugador pagó por otro
 * medio (efectivo, etc.) y lo marca manualmente. */
export const ConfirmPaymentSchema = z.object({
  participantId: z.uuid({ error: "Participante inválido." }),
  matchId: z.uuid({ error: "Partido inválido." }),
  // z.coerce.boolean() treats any non-empty string (incl. "false") as true —
  // this field always arrives as the literal "true"/"false" from a hidden
  // form field, so compare it explicitly instead.
  confirmed: z.literal(["true", "false"]).transform((value) => value === "true"),
});
