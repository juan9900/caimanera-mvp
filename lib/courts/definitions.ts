import * as z from "zod";
import { AMENITY_KEYS } from "@/lib/courts/amenities";
import { SPORT_CATALOG_KEYS } from "@/lib/courts/sports";

/**
 * Sponsorship/amenity fields shared by create and edit forms. `photosText`
 * holds one photo URL per line (textarea) — parsed into `courts.photos[]` by
 * the calling action; there's no file upload yet, courts are pasted URLs.
 */
const SponsorshipFields = {
  logoUrl: z.string().trim().url({ error: "Ingresa una URL válida." }).optional().or(z.literal("")),
  photosText: z.string().trim().optional(),
  whatsappUrl: z.string().trim().url({ error: "Ingresa una URL válida." }).optional().or(z.literal("")),
  bookingUrl: z.string().trim().url({ error: "Ingresa una URL válida." }).optional().or(z.literal("")),
  amenities: z.array(z.enum(AMENITY_KEYS)).optional().default([]),
  sports: z.array(z.enum(SPORT_CATALOG_KEYS)).optional().default([]),
  isOfficial: z.coerce.boolean().optional().default(false),
  sponsoredUntil: z.string().trim().optional(),
  sponsorPriority: z.coerce.number().int().optional().default(0),
  promoText: z.string().trim().optional(),
  promoCode: z.string().trim().optional(),
  promoExpiresAt: z.string().trim().optional(),
};

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
  address: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  schedule: z.string().trim().optional(),
  ...SponsorshipFields,
});

export type AddCourtFormState =
  | {
      errors?: {
        name?: string[];
        lat?: string[];
        lng?: string[];
        address?: string[];
        contactPhone?: string[];
        schedule?: string[];
        logoUrl?: string[];
        whatsappUrl?: string[];
        bookingUrl?: string[];
        sponsoredUntil?: string[];
        sponsorPriority?: string[];
        promoText?: string[];
        promoCode?: string[];
        promoExpiresAt?: string[];
      };
      message?: string;
    }
  | undefined;

export const EditCourtFormSchema = AddCourtFormSchema;
export type EditCourtFormState = AddCourtFormState;
