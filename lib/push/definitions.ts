import * as z from "zod";

export const PushSubscriptionSchema = z.object({
  endpoint: z.url({ error: "Suscripción inválida." }),
  keys: z.object({
    p256dh: z.string().min(1, { error: "Suscripción inválida." }),
    auth: z.string().min(1, { error: "Suscripción inválida." }),
  }),
});

export const AUDIENCE_SCOPES = ["red", "amigos", "canchas"] as const;
export type AudienceScope = (typeof AUDIENCE_SCOPES)[number];
