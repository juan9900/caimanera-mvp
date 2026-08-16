import * as z from "zod";
import { SPORT_OPTIONS } from "@/lib/auth/definitions";

export const CreateMatchFormSchema = z.object({
  courtId: z.uuid({ error: "Selecciona una cancha." }),
  sport: z.enum(SPORT_OPTIONS, { error: "Selecciona un deporte." }),
  datetime: z.coerce
    .date({ error: "Ingresa una fecha y hora válidas." })
    .refine((date) => date.getTime() > Date.now(), {
      error: "La fecha debe ser en el futuro.",
    }),
  vibe: z.enum(["relajado", "competitivo"], {
    error: "Selecciona una vibra.",
  }),
  totalSlots: z.coerce
    .number({ error: "Ingresa la cantidad de cupos." })
    .int()
    .min(2, { error: "Mínimo 2 cupos." })
    .max(30, { error: "Máximo 30 cupos." }),
});

export type CreateMatchFormState =
  | {
      errors?: {
        courtId?: string[];
        sport?: string[];
        datetime?: string[];
        vibe?: string[];
        totalSlots?: string[];
      };
      message?: string;
    }
  | undefined;
