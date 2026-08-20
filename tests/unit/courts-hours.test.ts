import { formatTodayHours } from "@/lib/courts/hours";

// Thursday, Jan 1 2026 — getDay() === 4
const THURSDAY = new Date("2026-01-01T12:00:00");

describe("formatTodayHours", () => {
  it("formats opens_at/closes_at as a 12-hour range when open today", () => {
    const result = formatTodayHours(
      { opens_at: "07:00:00", closes_at: "23:30:00", open_days: [0, 1, 2, 3, 4, 5, 6] },
      THURSDAY
    );
    expect(result).toBe("7:00 AM – 11:30 PM");
  });

  it("handles midnight and noon boundaries", () => {
    const result = formatTodayHours(
      { opens_at: "00:00:00", closes_at: "12:00:00", open_days: [4] },
      THURSDAY
    );
    expect(result).toBe("12:00 AM – 12:00 PM");
  });

  it("returns 'Cerrado hoy' when today isn't in open_days", () => {
    const result = formatTodayHours(
      { opens_at: "07:00:00", closes_at: "20:00:00", open_days: [1, 2, 3, 5] },
      THURSDAY
    );
    expect(result).toBe("Cerrado hoy");
  });

  it("returns 'Horario no disponible' when hours aren't set", () => {
    expect(
      formatTodayHours({ opens_at: null, closes_at: null, open_days: [0, 1, 2, 3, 4, 5, 6] }, THURSDAY)
    ).toBe("Horario no disponible");
  });
});
