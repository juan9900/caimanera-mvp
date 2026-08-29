"use client";

import { useActionState } from "react";
import { setCourtPlan, cancelCourtPlan, registerCourtPayment, removeCourtManager } from "@/app/actions/billing";
import { CourtManagerSearch } from "@/components/admin/court-manager-search";
import { SELECTABLE_PLAN_ORDER, PLANS, subscriptionState } from "@/lib/billing/plans";
import { Card, CardHeader, CardBody } from "@/components/admin/ui/card";
import { Field, Input, Select } from "@/components/admin/ui/field";
import { Button } from "@/components/admin/ui/button";
import { Badge, type BadgeTone } from "@/components/admin/ui/badge";
import type { CourtManager, CourtSubscription } from "@/lib/auth/dal";

const STATE_LABEL: Record<ReturnType<typeof subscriptionState>, string> = {
  activa: "Activa",
  en_gracia: "En gracia (venció, dentro de los días de gracia)",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

const STATE_TONE: Record<ReturnType<typeof subscriptionState>, BadgeTone> = {
  activa: "green",
  en_gracia: "amber",
  vencida: "red",
  cancelada: "zinc",
};

/** Convierte un timestamp ISO a `yyyy-mm-dd` para el `defaultValue` de un input `date`. */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/**
 * Tarjetas "Plan actual", "Registrar cobro" y "Dueños vinculados" de
 * `/admin/canchas/[id]/editar`. Es el único lugar que gestiona el plan pagado —
 * ver `docs/business-model.md` y la migración `court_billing_plans`.
 */
export function CourtPlanCard({
  courtId,
  subscription,
  managers,
}: {
  courtId: string;
  subscription: CourtSubscription | null;
  managers: CourtManager[];
}) {
  const [planState, planAction, planPending] = useActionState(
    setCourtPlan.bind(null, courtId),
    undefined,
  );
  const [paymentState, paymentAction, paymentPending] = useActionState(
    registerCourtPayment.bind(null, courtId),
    undefined,
  );

  const state = subscription ? subscriptionState(subscription) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Plan actual"
          description={
            subscription && state ? (
              <>
                {PLANS[subscription.plan].label} · vence el{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("es-VE", {
                  dateStyle: "medium",
                  timeZone: "America/Caracas",
                })}{" "}
                (gracia de {subscription.grace_days} días)
              </>
            ) : (
              "Esta cancha no tiene ningún plan activo todavía."
            )
          }
          action={state && <Badge tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Badge>}
        />
        <CardBody>
          <form action={planAction} className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Fijar / renovar plan
            </p>

            <div className="flex gap-3">
              <div className="flex-1">
                <Field label="Plan" htmlFor="plan" error={planState?.errors?.plan?.[0]}>
                  <Select id="plan" name="plan" defaultValue={subscription?.plan ?? "visible"}>
                    {SELECTABLE_PLAN_ORDER.map((plan) => (
                      <option key={plan} value={plan}>
                        {PLANS[plan].label} (US$ {PLANS[plan].priceUsdMonthly}/mes)
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex-1">
                <Field
                  label="Cubre hasta"
                  htmlFor="currentPeriodEnd"
                  error={planState?.errors?.currentPeriodEnd?.[0]}
                >
                  <Input
                    id="currentPeriodEnd"
                    name="currentPeriodEnd"
                    type="date"
                    defaultValue={toDateInput(subscription?.current_period_end)}
                  />
                </Field>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Field label="Días de gracia" htmlFor="graceDays">
                  <Input
                    id="graceDays"
                    name="graceDays"
                    type="number"
                    defaultValue={subscription?.grace_days ?? 7}
                  />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Precio acordado (USD, opcional)" htmlFor="priceUsd">
                  <Input
                    id="priceUsd"
                    name="priceUsd"
                    type="number"
                    step="0.01"
                    defaultValue={subscription?.price_usd ?? ""}
                  />
                </Field>
              </div>
            </div>

            <Field label="Notas (opcional)" htmlFor="notes">
              <Input
                id="notes"
                name="notes"
                defaultValue={subscription?.notes ?? ""}
                placeholder="Ej: acordado por WhatsApp con el dueño"
              />
            </Field>

            {planState?.message && <p className="text-sm text-red-600">{planState.message}</p>}
            {planState?.success && <p className="text-sm text-green-700">{planState.success}</p>}

            <div className="flex gap-2">
              <Button disabled={planPending} type="submit" variant="primary">
                {planPending ? "Guardando..." : "Guardar plan"}
              </Button>
              {subscription && state !== "cancelada" && (
                <Button type="submit" variant="danger" formAction={cancelCourtPlan.bind(null, courtId)}>
                  Cancelar plan
                </Button>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Registrar cobro recibido (Pago Móvil/Zelle)" />
        <CardBody>
          <form action={paymentAction} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Field label="Plan pagado" htmlFor="paymentPlan">
                  <Select id="paymentPlan" name="plan" defaultValue={subscription?.plan ?? "visible"}>
                    {SELECTABLE_PLAN_ORDER.map((plan) => (
                      <option key={plan} value={plan}>
                        {PLANS[plan].label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Monto (USD)" htmlFor="amountUsd" error={paymentState?.errors?.amountUsd?.[0]}>
                  <Input id="amountUsd" name="amountUsd" type="number" step="0.01" />
                </Field>
              </div>
            </div>

            <Field label="Cubre hasta" htmlFor="coversUntil" error={paymentState?.errors?.coversUntil?.[0]}>
              <Input id="coversUntil" name="coversUntil" type="date" />
            </Field>

            <div className="flex gap-3">
              <div className="flex-1">
                <Field label="Método (opcional)" htmlFor="method">
                  <Input id="method" name="method" placeholder="Pago Móvil / Zelle / transferencia" />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Referencia (opcional)" htmlFor="reference">
                  <Input id="reference" name="reference" />
                </Field>
              </div>
            </div>

            {paymentState?.message && <p className="text-sm text-red-600">{paymentState.message}</p>}
            {paymentState?.success && <p className="text-sm text-green-700">{paymentState.success}</p>}

            <Button disabled={paymentPending} type="submit" variant="secondary">
              {paymentPending ? "Registrando..." : "Registrar cobro"}
            </Button>
            <p className="text-xs text-zinc-500">
              Esto solo queda en la bitácora — para que el plan siga activo hay que extender
              &quot;Cubre hasta&quot; en el plan actual.
            </p>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Dueños / managers vinculados" />
        <CardBody>
          {managers.length === 0 ? (
            <p className="mb-3 text-sm text-zinc-500">Nadie vinculado todavía.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {managers.map((manager) => (
                <li
                  key={manager.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
                >
                  <span className="text-sm text-zinc-900">
                    {manager.user?.name ?? "Usuario"} · {manager.role}
                  </span>
                  <form action={removeCourtManager.bind(null, manager.id, courtId)}>
                    <button type="submit" className="text-xs font-medium text-red-700 hover:underline">
                      Desvincular
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <CourtManagerSearch courtId={courtId} linkedUserIds={managers.map((m) => m.user_id)} />
        </CardBody>
      </Card>
    </div>
  );
}
