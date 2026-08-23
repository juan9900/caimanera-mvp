import * as z from "zod";
import { SPORT_CATALOG_KEYS } from "@/lib/courts/sports";

export const SignupFormSchema = z.object({
  email: z.email({ error: "Ingresa un email válido." }).trim(),
  password: z
    .string()
    .min(8, { error: "Debe tener al menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { error: "Debe contener al menos una letra." })
    .regex(/[0-9]/, { error: "Debe contener al menos un número." }),
});

export type SignupFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
      /** True once `signUp` succeeded and Supabase requires email confirmation — the form swaps to a confirmation message instead of showing the inputs again. */
      success?: boolean;
    }
  | undefined;

export const LoginFormSchema = z.object({
  email: z.email({ error: "Ingresa un email válido." }).trim(),
  password: z.string().min(1, { error: "Ingresa tu contraseña." }),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const ForgotPasswordSchema = z.object({
  email: z.email({ error: "Ingresa un email válido." }).trim(),
});

export type ForgotPasswordState =
  | {
      errors?: {
        email?: string[];
      };
      message?: string;
      /** True once the reset email was requested — the form swaps to a confirmation message. Always set on success, regardless of whether the email is actually registered (avoids leaking account existence). */
      success?: boolean;
    }
  | undefined;

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "Debe tener al menos 8 caracteres." })
      .regex(/[a-zA-Z]/, { error: "Debe contener al menos una letra." })
      .regex(/[0-9]/, { error: "Debe contener al menos un número." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState =
  | {
      errors?: {
        password?: string[];
        confirmPassword?: string[];
      };
      message?: string;
    }
  | undefined;

export const SPORT_OPTIONS = SPORT_CATALOG_KEYS;

export const NOTIFICATION_SCOPE_OPTIONS = ["red", "amigos", "canchas"] as const;
export type NotificationScope = (typeof NOTIFICATION_SCOPE_OPTIONS)[number];

const SportKeySchema = z.enum(SPORT_OPTIONS as [string, ...string[]]);

/** A `location_lat`/`location_lng` coordinate submitted as a form field (string) — must be present and a finite number, not silently coerced from a missing/empty field. */
const LocationCoordFieldSchema = z
  .string({ error: "Elige tu ciudad." })
  .trim()
  .min(1, { error: "Elige tu ciudad." })
  .transform((v) => Number(v))
  .refine((n) => Number.isFinite(n), { error: "Elige tu ciudad." });

export const OnboardingFormSchema = z.object({
  name: z.string().trim().min(2, { error: "Ingresa tu nombre." }),
  locationLabel: z.string({ error: "Elige tu ciudad." }).trim().min(1, { error: "Elige tu ciudad." }),
  locationLat: LocationCoordFieldSchema,
  locationLng: LocationCoordFieldSchema,
  sportPreferences: z
    .array(SportKeySchema)
    .min(1, { error: "Elige al menos un deporte." }),
  vibe: z.enum(["relajado", "competitivo"], {
    error: "Elige una vibra.",
  }),
  notificationScopes: z.array(z.enum(NOTIFICATION_SCOPE_OPTIONS)).default([]),
});

export type OnboardingFormState =
  | {
      errors?: {
        name?: string[];
        locationLabel?: string[];
        locationLat?: string[];
        locationLng?: string[];
        sportPreferences?: string[];
        vibe?: string[];
        notificationScopes?: string[];
      };
      message?: string;
    }
  | undefined;

export const NotificationScopesSchema = z.array(z.enum(NOTIFICATION_SCOPE_OPTIONS));

/** Everything editable from `/perfil` after onboarding — same rules as onboarding, minus `name`. */
export const ProfileEditSchema = z.object({
  location: z.object({
    label: z.string().trim().min(1, { error: "Elige tu ciudad." }),
    lat: z.number({ error: "Elige tu ciudad." }),
    lng: z.number({ error: "Elige tu ciudad." }),
  }),
  vibe: z.enum(["relajado", "competitivo"], {
    error: "Elige una vibra.",
  }),
  sportPreferences: z
    .array(SportKeySchema)
    .min(1, { error: "Elige al menos un deporte." }),
});

export type ProfileEditState =
  | {
      errors?: {
        location?: string[];
        vibe?: string[];
        sportPreferences?: string[];
      };
      message?: string;
    }
  | undefined;
