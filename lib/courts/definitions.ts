import * as z from "zod";

export const AddCourtFormSchema = z.object({
  name: z.string().trim().min(2, { error: "Ingresa el nombre de la cancha." }),
  lat: z.coerce
    .number({ error: "Ingresa una latitud válida." })
    .min(-90)
    .max(90),
  lng: z.coerce
    .number({ error: "Ingresa una longitud válida." })
    .min(-180)
    .max(180),
  contactPhone: z.string().trim().optional(),
  schedule: z.string().trim().optional(),
});

export type AddCourtFormState =
  | {
      errors?: {
        name?: string[];
        lat?: string[];
        lng?: string[];
        contactPhone?: string[];
        schedule?: string[];
      };
      message?: string;
    }
  | undefined;
