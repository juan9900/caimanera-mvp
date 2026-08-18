import {
  LoginFormSchema,
  OnboardingFormSchema,
  SignupFormSchema,
} from "@/lib/auth/definitions";
import { AddCourtFormSchema } from "@/lib/courts/definitions";
import { CreateMatchFormSchema } from "@/lib/matches/definitions";

describe("SignupFormSchema", () => {
  it("accepts a valid signup payload", () => {
    const result = SignupFormSchema.safeParse({
      inviteCode: "ABC123",
      email: "juan@example.com",
      password: "abc12345",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing invite code", () => {
    const result = SignupFormSchema.safeParse({
      inviteCode: "",
      email: "juan@example.com",
      password: "abc12345",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a weak password", () => {
    const result = SignupFormSchema.safeParse({
      inviteCode: "ABC123",
      email: "juan@example.com",
      password: "onlyletters",
    });

    expect(result.success).toBe(false);
  });
});

describe("LoginFormSchema", () => {
  it("rejects an invalid email", () => {
    const result = LoginFormSchema.safeParse({
      email: "not-an-email",
      password: "whatever",
    });

    expect(result.success).toBe(false);
  });
});

describe("OnboardingFormSchema", () => {
  it("accepts a valid onboarding payload", () => {
    const result = OnboardingFormSchema.safeParse({
      name: "Juan",
      zone: "La Lago",
      sportPreferences: ["futbol"],
      vibe: "relajado",
    });

    expect(result.success).toBe(true);
  });

  it("rejects when no sport is selected", () => {
    const result = OnboardingFormSchema.safeParse({
      name: "Juan",
      zone: "La Lago",
      sportPreferences: [],
      vibe: "relajado",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid vibe", () => {
    const result = OnboardingFormSchema.safeParse({
      name: "Juan",
      zone: "La Lago",
      sportPreferences: ["futbol"],
      vibe: "loco",
    });

    expect(result.success).toBe(false);
  });
});

describe("AddCourtFormSchema", () => {
  it("accepts a valid court payload and coerces lat/lng to numbers", () => {
    const result = AddCourtFormSchema.safeParse({
      name: "Cancha Los Haticos",
      lat: "10.6316",
      lng: "-71.6444",
      contactPhone: "",
      schedule: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lat).toBe(10.6316);
      expect(result.data.lng).toBe(-71.6444);
    }
  });

  it("rejects an out-of-range latitude", () => {
    const result = AddCourtFormSchema.safeParse({
      name: "Cancha Los Haticos",
      lat: "200",
      lng: "-71.6444",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    const result = AddCourtFormSchema.safeParse({
      name: "",
      lat: "10.6316",
      lng: "-71.6444",
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateMatchFormSchema", () => {
  const futureDatetime = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  it("accepts a valid match payload and coerces totalSlots to a number", () => {
    const result = CreateMatchFormSchema.safeParse({
      courtId: "b3c1f6c0-1c2a-4c3a-9b1e-000000000000",
      sport: "futbol",
      datetime: futureDatetime,
      vibe: "relajado",
      totalSlots: "10",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalSlots).toBe(10);
    }
  });

  it("rejects a datetime in the past", () => {
    const result = CreateMatchFormSchema.safeParse({
      courtId: "b3c1f6c0-1c2a-4c3a-9b1e-000000000000",
      sport: "futbol",
      datetime: "2020-01-01T10:00",
      vibe: "relajado",
      totalSlots: "10",
    });

    expect(result.success).toBe(false);
  });

  it("rejects fewer than 2 total slots", () => {
    const result = CreateMatchFormSchema.safeParse({
      courtId: "b3c1f6c0-1c2a-4c3a-9b1e-000000000000",
      sport: "futbol",
      datetime: futureDatetime,
      vibe: "relajado",
      totalSlots: "1",
    });

    expect(result.success).toBe(false);
  });
});
