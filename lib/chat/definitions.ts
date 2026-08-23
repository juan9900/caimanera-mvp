import * as z from "zod";

export const SendMessageSchema = z.object({
  matchId: z.uuid({ error: "Partido inválido." }),
  body: z
    .string()
    .trim()
    .min(1, { error: "Escribe un mensaje." })
    .max(1000, { error: "El mensaje es demasiado largo." }),
});
