import * as z from "zod";
import { SPORT_CATALOG_KEYS } from "@/lib/courts/sports";

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

export const CreateMatchFormSchema = z
  .object({
    courtId: z.uuid({ error: "Selecciona una cancha." }),
    sport: z.enum(SPORT_CATALOG_KEYS, { error: "Selecciona un deporte." }),
    datetime: z.coerce
      .date({ error: "Ingresa una fecha y hora válidas." })
      .refine((date) => date.getTime() > Date.now(), {
        error: "La fecha debe ser en el futuro.",
      }),
    vibe: z.enum(["relajado", "competitivo"], {
      error: "Selecciona una vibra.",
    }),
    isPublic: z.coerce.boolean().optional().default(true),
    // Opt-in: crear un partido no avisa a nadie salvo que el organizador lo
    // pida explícitamente. Solo aplica a partidos públicos.
    notifyAudience: z.coerce.boolean().optional().default(false),
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
  })
  .superRefine((data, ctx) => {
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
  });

export type CreateMatchFormState =
  | {
      errors?: {
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
      message?: string;
    }
  | undefined;
