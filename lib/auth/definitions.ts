import * as z from "zod";

export const SignupFormSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(1, { error: "Ingresa tu código de invitación." }),
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
        inviteCode?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
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

export const SPORT_OPTIONS = ["futbol"] as const;

export const NOTIFICATION_SCOPE_OPTIONS = ["red", "amigos", "canchas"] as const;
export type NotificationScope = (typeof NOTIFICATION_SCOPE_OPTIONS)[number];

export const OnboardingFormSchema = z.object({
  name: z.string().trim().min(2, { error: "Ingresa tu nombre." }),
  zone: z.string().trim().min(2, { error: "Ingresa tu zona en Maracaibo." }),
  sportPreferences: z
    .array(z.enum(SPORT_OPTIONS))
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
        zone?: string[];
        sportPreferences?: string[];
        vibe?: string[];
        notificationScopes?: string[];
      };
      message?: string;
    }
  | undefined;

export const NotificationScopesSchema = z.array(z.enum(NOTIFICATION_SCOPE_OPTIONS));
