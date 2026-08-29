import * as z from "zod";
import { AMENITY_KEYS } from "@/lib/courts/amenities";
import { SPORT_CATALOG_KEYS } from "@/lib/courts/sports";
import type { Court } from "@/lib/auth/dal";

/**
 * Sponsorship/amenity fields shared by create and edit forms. `photosText`
 * holds one photo URL per line (textarea) — parsed into `courts.photos[]` by
 * the calling action; there's no file upload yet, courts are pasted URLs.
 *
 * `isOfficial`/`sponsoredUntil` NO están acá a propósito: desde la migración
 * `court_billing_plans` son un agregado derivado del plan pagado de la cancha
 * (ver `lib/billing/plans.ts` y `setCourtPlan` en `app/actions/billing.ts`), no
 * campos que este form deba escribir.
 */
const SponsorshipFields = {
  logoUrl: z.string().trim().url({ error: "Ingresa una URL válida." }).optional().or(z.literal("")),
  photosText: z.string().trim().optional(),
  whatsappUrl: z.string().trim().url({ error: "Ingresa una URL válida." }).optional().or(z.literal("")),
  bookingUrl: z.string().trim().url({ error: "Ingresa una URL válida." }).optional().or(z.literal("")),
  amenities: z.array(z.enum(AMENITY_KEYS)).optional().default([]),
  sports: z.array(z.enum(SPORT_CATALOG_KEYS)).optional().default([]),
  isPublic: z.coerce.boolean().optional().default(false),
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

/**
 * Any signed-in user can add a place that isn't in the catalog yet: a name
 * plus a point picked on the map. It's created immediately as a court with
 * `verified: false` — visible only to its creator and admins until an admin
 * verifies it (see `createPendingCourt` in `app/actions/courts.ts`).
 */
export const AddPendingCourtFormSchema = z.object({
  name: z.string().trim().min(2, { error: "Ingresa el nombre del lugar." }),
  lat: z.coerce
    .number({ error: "Selecciona un punto en el mapa." })
    .min(-90)
    .max(90),
  lng: z.coerce
    .number({ error: "Selecciona un punto en el mapa." })
    .min(-180)
    .max(180),
  reference: z.string().trim().optional(),
});

export type PendingCourtResult = { id: string; name: string; lat: number; lng: number; sports: string[] };

export type AddPendingCourtFormState =
  | {
      errors?: {
        name?: string[];
        lat?: string[];
        lng?: string[];
        reference?: string[];
      };
      message?: string;
      success?: boolean;
      court?: PendingCourtResult;
    }
  | undefined;

/**
 * Fills in the rest of a `Court` row's fields with the same defaults
 * `createPendingCourt` inserts, so a court just added in the create/edit
 * match forms can be appended to the local `courts` list (for the picker's
 * sort/badge logic) without an extra fetch.
 */
export function pendingCourtToCourt(court: PendingCourtResult): Court {
  return {
    id: court.id,
    name: court.name,
    lat: court.lat,
    lng: court.lng,
    sports: court.sports,
    added_by: "",
    address: null,
    amenities: [],
    booking_url: null,
    closes_at: null,
    contact_phone: null,
    created_at: new Date().toISOString(),
    is_official: false,
    is_public: true,
    logo_url: null,
    open_days: [],
    opens_at: null,
    photos: null,
    promo_code: null,
    promo_expires_at: null,
    promo_text: null,
    rating_avg: 0,
    rating_count: 0,
    schedule: null,
    sponsor_priority: 0,
    sponsored_until: null,
    verified: false,
    whatsapp_url: null,
  };
}
