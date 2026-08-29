import { planAllows, subscriptionState, isSubscriptionActive, comparePlans } from "@/lib/billing/plans";

function makeSub(overrides: Partial<{
  plan: "basico" | "visible" | "agenda" | "pro";
  current_period_end: string;
  grace_days: number;
  canceled_at: string | null;
}> = {}) {
  return {
    plan: "basico" as const,
    current_period_end: "2026-06-15T00:00:00.000Z",
    grace_days: 7,
    canceled_at: null,
    ...overrides,
  };
}

const NOW = new Date("2026-06-15T00:00:00.000Z");

describe("planAllows", () => {
  it("básico solo desbloquea la ficha completa", () => {
    expect(planAllows("basico", "ficha_completa")).toBe(true);
    expect(planAllows("basico", "destacado_home")).toBe(false);
    expect(planAllows("basico", "agenda")).toBe(false);
    expect(planAllows("basico", "torneos")).toBe(false);
  });

  it("visible agrega destacado/promo/métricas pero no agenda ni torneos", () => {
    expect(planAllows("visible", "ficha_completa")).toBe(true);
    expect(planAllows("visible", "destacado_home")).toBe(true);
    expect(planAllows("visible", "promo")).toBe(true);
    expect(planAllows("visible", "metricas_completas")).toBe(true);
    expect(planAllows("visible", "agenda")).toBe(false);
    expect(planAllows("visible", "torneos")).toBe(false);
  });

  it("agenda agrega reservas pero no torneos", () => {
    expect(planAllows("agenda", "agenda")).toBe(true);
    expect(planAllows("agenda", "torneos")).toBe(false);
  });

  it("pro desbloquea todo, incluyendo torneos", () => {
    expect(planAllows("pro", "ficha_completa")).toBe(true);
    expect(planAllows("pro", "destacado_home")).toBe(true);
    expect(planAllows("pro", "agenda")).toBe(true);
    expect(planAllows("pro", "torneos")).toBe(true);
  });
});

describe("comparePlans", () => {
  it("ordena básico < visible < agenda < pro", () => {
    expect(comparePlans("basico", "visible")).toBeLessThan(0);
    expect(comparePlans("visible", "agenda")).toBeLessThan(0);
    expect(comparePlans("agenda", "pro")).toBeLessThan(0);
    expect(comparePlans("pro", "basico")).toBeGreaterThan(0);
    expect(comparePlans("visible", "visible")).toBe(0);
  });
});

describe("subscriptionState", () => {
  it("está activa mientras no pase current_period_end", () => {
    const sub = makeSub({ current_period_end: "2026-06-20T00:00:00.000Z" });
    expect(subscriptionState(sub, NOW)).toBe("activa");
  });

  it("cae en gracia justo al pasar current_period_end, dentro de grace_days", () => {
    const sub = makeSub({ current_period_end: "2026-06-10T00:00:00.000Z", grace_days: 7 });
    // 5 días después del vencimiento, dentro de los 7 de gracia
    expect(subscriptionState(sub, NOW)).toBe("en_gracia");
  });

  it("pasa a vencida una vez consumida la gracia", () => {
    const sub = makeSub({ current_period_end: "2026-06-01T00:00:00.000Z", grace_days: 7 });
    // 14 días después del vencimiento, ya pasó la gracia de 7
    expect(subscriptionState(sub, NOW)).toBe("vencida");
  });

  it("una cancelación explícita pesa más que la fecha, aunque el período siga vigente", () => {
    const sub = makeSub({
      current_period_end: "2026-12-31T00:00:00.000Z",
      canceled_at: "2026-06-01T00:00:00.000Z",
    });
    expect(subscriptionState(sub, NOW)).toBe("cancelada");
  });
});

describe("isSubscriptionActive", () => {
  it("cuenta activa y en_gracia como activas", () => {
    expect(isSubscriptionActive(makeSub({ current_period_end: "2026-06-20T00:00:00.000Z" }), NOW)).toBe(true);
    expect(
      isSubscriptionActive(makeSub({ current_period_end: "2026-06-10T00:00:00.000Z" }), NOW),
    ).toBe(true);
  });

  it("no cuenta vencida ni cancelada como activas", () => {
    expect(
      isSubscriptionActive(makeSub({ current_period_end: "2026-06-01T00:00:00.000Z" }), NOW),
    ).toBe(false);
    expect(
      isSubscriptionActive(
        makeSub({ current_period_end: "2026-12-31T00:00:00.000Z", canceled_at: "2026-06-01T00:00:00.000Z" }),
        NOW,
      ),
    ).toBe(false);
  });
});
