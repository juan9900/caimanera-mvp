import {
  LoginFormSchema,
  OnboardingFormSchema,
  SignupFormSchema,
} from "@/lib/auth/definitions";

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
      sportPreferences: ["tenis"],
      vibe: "loco",
    });

    expect(result.success).toBe(false);
  });
});
