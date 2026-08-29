import * as z from "zod";
import { SELECTABLE_PLAN_ORDER } from "@/lib/billing/plans";

/**
 * Fija o renueva el plan de una cancha (`setCourtPlan`, `app/actions/billing.ts`).
 * `currentPeriodEnd` es un `date` (input HTML) — el admin fija hasta cuándo cubre el
 * cobro que ya recibió por Pago Móvil/Zelle; no hay cálculo automático de fin de mes.
 */
export const SetCourtPlanFormSchema = z.object({
  plan: z.enum(SELECTABLE_PLAN_ORDER, { error: "Selecciona un plan." }),
  currentPeriodEnd: z.string().trim().min(1, { error: "Ingresa hasta cuándo cubre el plan." }),
  graceDays: z.coerce.number().int().min(0).optional().default(7),
  priceUsd: z.coerce.number().min(0).optional(),
  notes: z.string().trim().optional(),
});

export type SetCourtPlanFormState =
  | {
      errors?: {
        plan?: string[];
        currentPeriodEnd?: string[];
        graceDays?: string[];
        priceUsd?: string[];
        notes?: string[];
      };
      message?: string;
      success?: string;
    }
  | undefined;

/** Registra un cobro manual recibido (`registerCourtPayment`) — queda en la bitácora `court_payments`. */
export const RegisterCourtPaymentFormSchema = z.object({
  plan: z.enum(SELECTABLE_PLAN_ORDER, { error: "Selecciona el plan pagado." }),
  amountUsd: z.coerce.number({ error: "Ingresa el monto en USD." }).positive(),
  coversUntil: z.string().trim().min(1, { error: "Ingresa hasta cuándo cubre el pago." }),
  method: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export type RegisterCourtPaymentFormState =
  | {
      errors?: {
        plan?: string[];
        amountUsd?: string[];
        coversUntil?: string[];
        method?: string[];
        reference?: string[];
        note?: string[];
      };
      message?: string;
      success?: string;
    }
  | undefined;

/** Vincula a un usuario existente como dueño/manager de una cancha (`addCourtManager`). */
export const AddCourtManagerFormSchema = z.object({
  userId: z.string().trim().uuid({ error: "Selecciona un usuario." }),
  role: z.string().trim().optional().default("owner"),
});

export type AddCourtManagerFormState =
  | {
      errors?: {
        userId?: string[];
        role?: string[];
      };
      message?: string;
    }
  | undefined;
