import * as z from "zod";
import { SPORT_CATALOG_KEYS } from "@/lib/courts/sports";
import type { Enums } from "@/lib/supabase/database.types";

export type MatchVisibility = Enums<"match_visibility">;

export const BANK_OPTIONS = [
  "Banesco",
  "Mercantil",
  "Provincial (BBVA)",
  "Banco de Venezuela",
  "Bicentenario",
  "BNC",
  "BOD",
  "Banplus",
  "Bancaribe",
  "Banco del Tesoro",
  "100% Banco",
  "Mi Banco",
] as const;

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/**
 * Fields shared by creating and editing a match. Kept as a plain object (not
 * a `z.object` with `.extend`) so each caller can attach its own
 * `.superRefine` for the payment cross-field validation without fighting
 * zod's type inference on top of a refined schema.
 */
const matchFieldsShape = {
  courtId: z.uuid({ error: "Selecciona una cancha." }),
  sport: z.enum(SPORT_CATALOG_KEYS, { error: "Selecciona un deporte." }),
  datetime: z.coerce
    .date({ error: "Ingresa una fecha y hora válidas." })
    .refine((date) => date.getTime() > Date.now(), {
      error: "La fecha debe ser en el futuro.",
    })
    .refine((date) => date.getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000, {
      error: "La fecha no puede ser más de 30 días en el futuro.",
    }),
  vibe: z.enum(["relajado", "competitivo"], {
    error: "Selecciona una vibra.",
  }),
  totalSlots: z.coerce
    .number({ error: "Ingresa la cantidad de cupos." })
    .int()
    .min(2, { error: "Mínimo 2 cupos." })
    .max(30, { error: "Máximo 30 cupos." }),
  paymentBank: z.preprocess(
    emptyToUndefined,
    z.enum(BANK_OPTIONS, { error: "Selecciona un banco válido." }).optional()
  ),
  paymentPhone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^0(412|414|416|424|426)-?\d{7}$/, {
        error: "Ingresa un teléfono válido (ej. 0412-1234567).",
      })
      .optional()
  ),
  paymentCedula: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^[VEve]-?\d{6,9}$/, {
        error: "Ingresa una cédula válida (ej. V-12345678).",
      })
      .optional()
  ),
  paymentAmountBs: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Ingresa un monto válido." })
      .positive({ error: "El monto debe ser mayor a 0." })
      .optional()
  ),
};

/** Cross-field payment validation shared by create and update. */
function refinePaymentFields(
  data: { paymentAmountBs?: number; paymentBank?: string; paymentPhone?: string; paymentCedula?: string },
  ctx: z.RefinementCtx
) {
  if (data.paymentAmountBs === undefined) return;
  if (data.paymentBank === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["paymentBank"],
      message: "Selecciona un banco para el pago móvil.",
    });
  }
  if (data.paymentPhone === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["paymentPhone"],
      message: "Ingresa el teléfono para el pago móvil.",
    });
  }
  if (data.paymentCedula === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["paymentCedula"],
      message: "Ingresa la cédula para el pago móvil.",
    });
  }
}

export const CreateMatchFormSchema = z
  .object({
    ...matchFieldsShape,
    visibility: z
      .enum(["publica", "amigos", "privada"], { error: "Selecciona una visibilidad." })
      .optional()
      .default("publica"),
    // Opt-in: crear un partido no avisa a nadie salvo que el organizador lo
    // pida explícitamente. Solo aplica a partidos públicos.
    notifyAudience: z.coerce.boolean().optional().default(false),
  })
  .superRefine(refinePaymentFields);

export type MatchFormErrors = {
  courtId?: string[];
  sport?: string[];
  datetime?: string[];
  vibe?: string[];
  totalSlots?: string[];
  paymentBank?: string[];
  paymentPhone?: string[];
  paymentCedula?: string[];
  paymentAmountBs?: string[];
};

export type CreateMatchFormState =
  | {
      errors?: MatchFormErrors;
      message?: string;
    }
  | undefined;

/**
 * Editing an existing match: same base fields, no visibility/notifyAudience
 * (visibility has its own switch on the detail page, not part of this form).
 */
export const UpdateMatchFormSchema = z
  .object({ ...matchFieldsShape })
  .superRefine(refinePaymentFields);

export type UpdateMatchFormState =
  | {
      errors?: MatchFormErrors;
      message?: string;
    }
  | undefined;
