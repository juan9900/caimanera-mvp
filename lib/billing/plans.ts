import type { Enums, Tables } from "@/lib/supabase/database.types";

export type CourtPlan = Enums<"court_plan">;

/**
 * Catálogo de planes de cancha (ver `docs/business-model.md`). El orden importa:
 * coincide con el orden de declaración del enum `court_plan` en Postgres, así que
 * comparar planes con `PLAN_ORDER.indexOf(a) >= PLAN_ORDER.indexOf(b)` es equivalente
 * a la comparación `plan >= 'visible'` que usa `sync_court_plan_flags` en la base de
 * datos — mantenerlos en el mismo orden si se agrega un plan nuevo.
 */
export const PLAN_ORDER: CourtPlan[] = ["basico", "visible", "agenda", "pro"];

/**
 * Planes que se pueden ofrecer/seleccionar hoy. `basico` quedó deprecado: se fusionó
 * con `visible` (mismo precio y features) porque en la práctica eran el mismo plan de
 * entrada — ver conversación de negocio. Las canchas que tenían `basico` se migraron a
 * `visible`; el valor de enum se conserva solo por compatibilidad con filas viejas y con
 * `sync_court_plan_flags` en la base de datos.
 */
export const SELECTABLE_PLAN_ORDER: CourtPlan[] = ["visible", "agenda", "pro"];

export type PlanFeature =
  | "ficha_completa" // fotos, comodidades, WhatsApp, botón Reservar, rating
  | "destacado_home" // carrusel de destacados del home + prioridad en listado/mapa
  | "promo" // banner de promoción/cupón activo
  | "metricas_completas" // impresiones, clics, leads, horarios de mayor demanda
  | "agenda" // reservas dentro de Kancha
  | "torneos"; // crear torneos, aparecer en /torneos

export interface PlanDefinition {
  plan: CourtPlan;
  label: string;
  priceUsdMonthly: number;
  priceUsdYearly: number;
  features: PlanFeature[];
}

export const PLANS: Record<CourtPlan, PlanDefinition> = {
  basico: {
    plan: "basico",
    label: "Básico (plan anterior, deprecado)",
    priceUsdMonthly: 5,
    priceUsdYearly: 50,
    features: ["ficha_completa"],
  },
  visible: {
    plan: "visible",
    label: "Básico",
    priceUsdMonthly: 20,
    priceUsdYearly: 200,
    features: ["ficha_completa", "destacado_home", "promo", "metricas_completas"],
  },
  agenda: {
    plan: "agenda",
    label: "Agenda",
    priceUsdMonthly: 45,
    priceUsdYearly: 450,
    features: ["ficha_completa", "destacado_home", "promo", "metricas_completas", "agenda"],
  },
  pro: {
    plan: "pro",
    label: "Pro",
    priceUsdMonthly: 60,
    priceUsdYearly: 600,
    features: [
      "ficha_completa",
      "destacado_home",
      "promo",
      "metricas_completas",
      "agenda",
      "torneos",
    ],
  },
};

/** ¿El plan dado desbloquea esta feature? Cada nivel incluye todo lo de los anteriores. */
export function planAllows(plan: CourtPlan, feature: PlanFeature): boolean {
  return PLANS[plan].features.includes(feature);
}

/** Compara dos planes por su posición en la escalera: 1 si `a` es mayor, -1 si es menor, 0 si son iguales. */
export function comparePlans(a: CourtPlan, b: CourtPlan): number {
  return PLAN_ORDER.indexOf(a) - PLAN_ORDER.indexOf(b);
}

export type SubscriptionState = "activa" | "en_gracia" | "vencida" | "cancelada";

/**
 * Subset de `court_subscriptions` que necesita la lógica de estado — así el resto
 * del código puede pasar la fila completa de Supabase sin adaptarla.
 */
export type SubscriptionLike = Pick<
  Tables<"court_subscriptions">,
  "plan" | "current_period_end" | "grace_days" | "canceled_at"
>;

/**
 * Estado de una suscripción en un instante dado (por defecto, ahora). Refleja
 * exactamente la lógica de `court_active_plan`/`sync_court_plan_flags` en la base
 * de datos (ver migración `court_billing_plans`): cancelada explícitamente pesa más
 * que la fecha, y el período de gracia extiende "activa" antes de caer a "vencida".
 */
export function subscriptionState(sub: SubscriptionLike, now: Date = new Date()): SubscriptionState {
  if (sub.canceled_at != null) return "cancelada";

  const periodEnd = new Date(sub.current_period_end);
  if (now <= periodEnd) return "activa";

  const graceEnd = new Date(periodEnd.getTime() + sub.grace_days * 24 * 60 * 60 * 1000);
  if (now <= graceEnd) return "en_gracia";

  return "vencida";
}

/** Una suscripción cuenta como "activa" (a efectos de gating) si está `activa` o `en_gracia`. */
export function isSubscriptionActive(sub: SubscriptionLike, now: Date = new Date()): boolean {
  const state = subscriptionState(sub, now);
  return state === "activa" || state === "en_gracia";
}
