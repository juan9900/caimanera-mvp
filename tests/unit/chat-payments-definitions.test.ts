import { SendMessageSchema } from "@/lib/chat/definitions";
import { ConfirmPaymentSchema, ReportPaymentSchema } from "@/lib/payments/definitions";

const MATCH_ID = "8f14e45f-ceea-4c56-8b1a-4e0e7cf4a1b1";
const PARTICIPANT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("SendMessageSchema", () => {
  it("accepts a valid message", () => {
    const result = SendMessageSchema.safeParse({ matchId: MATCH_ID, body: "Nos vemos a las 5" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    const result = SendMessageSchema.safeParse({ matchId: MATCH_ID, body: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a message over 1000 characters", () => {
    const result = SendMessageSchema.safeParse({ matchId: MATCH_ID, body: "a".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid matchId", () => {
    const result = SendMessageSchema.safeParse({ matchId: "not-a-uuid", body: "hola" });
    expect(result.success).toBe(false);
  });
});

describe("ReportPaymentSchema", () => {
  it("accepts a valid reference", () => {
    const result = ReportPaymentSchema.safeParse({ matchId: MATCH_ID, reference: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty reference", () => {
    const result = ReportPaymentSchema.safeParse({ matchId: MATCH_ID, reference: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a reference over 40 characters", () => {
    const result = ReportPaymentSchema.safeParse({ matchId: MATCH_ID, reference: "a".repeat(41) });
    expect(result.success).toBe(false);
  });
});

describe("ConfirmPaymentSchema", () => {
  it("accepts and coerces a confirmed payload", () => {
    const result = ConfirmPaymentSchema.safeParse({
      participantId: PARTICIPANT_ID,
      matchId: MATCH_ID,
      confirmed: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.confirmed).toBe(true);
  });

  it("coerces the literal string \"false\" to boolean false (not truthy)", () => {
    const result = ConfirmPaymentSchema.safeParse({
      participantId: PARTICIPANT_ID,
      matchId: MATCH_ID,
      confirmed: "false",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.confirmed).toBe(false);
  });

  it("rejects an invalid participantId", () => {
    const result = ConfirmPaymentSchema.safeParse({
      participantId: "not-a-uuid",
      matchId: MATCH_ID,
      confirmed: "false",
    });
    expect(result.success).toBe(false);
  });
});
