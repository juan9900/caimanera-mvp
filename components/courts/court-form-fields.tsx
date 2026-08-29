import { AMENITIES } from "@/lib/courts/amenities";
import { SPORTS } from "@/lib/courts/sports";
import type { AddCourtFormState } from "@/lib/courts/definitions";
import { Field, Input, Textarea } from "@/components/admin/ui/field";

type CourtFormErrors = NonNullable<AddCourtFormState>["errors"];

/** Turns a stored `promo_expires_at` ISO string into a `datetime-local` input value. */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

/**
 * Sponsorship/amenity fields shared by the "add court" and "edit court" admin
 * forms: logo/photos URLs, amenity checkboxes, public flag, sponsor priority
 * and promo. Field `name`s match `AddCourtFormSchema` / `EditCourtFormSchema`
 * so both actions can read them via `formData.get(...)`.
 *
 * NO incluye el badge "Oficial" ni la fecha de patrocinio: desde la migración
 * `court_billing_plans` esos dos campos (`is_official`/`sponsored_until`) los
 * calcula solo el trigger a partir del plan pagado — se gestionan en la tarjeta
 * "Plan y cobro" de la página de edición, no en este form (ver `app/actions/billing.ts`).
 */
export function CourtSponsorshipFields({
  defaultValues,
  errors,
}: {
  defaultValues?: {
    logoUrl?: string | null;
    photos?: string[] | null;
    whatsappUrl?: string | null;
    bookingUrl?: string | null;
    amenities?: string[];
    sports?: string[];
    isPublic?: boolean;
    sponsorPriority?: number;
    promoText?: string | null;
    promoCode?: string | null;
    promoExpiresAt?: string | null;
  };
  errors?: CourtFormErrors;
}) {
  return (
    <>
      <Field label="Logo (URL, opcional)" htmlFor="logoUrl" error={errors?.logoUrl?.[0]}>
        <Input
          id="logoUrl"
          name="logoUrl"
          placeholder="https://…"
          defaultValue={defaultValues?.logoUrl ?? ""}
        />
      </Field>

      <Field label="Fotos (una URL por línea, opcional)" htmlFor="photosText">
        <Textarea
          id="photosText"
          name="photosText"
          rows={3}
          placeholder={"https://…\nhttps://…"}
          defaultValue={defaultValues?.photos?.join("\n") ?? ""}
        />
      </Field>

      <Field
        label="Link de WhatsApp (opcional)"
        htmlFor="whatsappUrl"
        hint="Si no lo llenas, se usa el teléfono de contacto de arriba."
        error={errors?.whatsappUrl?.[0]}
      >
        <Input
          id="whatsappUrl"
          name="whatsappUrl"
          placeholder="https://wa.me/584121234567"
          defaultValue={defaultValues?.whatsappUrl ?? ""}
        />
      </Field>

      <Field
        label="Link de reserva (opcional)"
        htmlFor="bookingUrl"
        hint="Para canchas con su propio sitio de reservas (si reservan por WhatsApp, deja esto vacío)."
        error={errors?.bookingUrl?.[0]}
      >
        <Input
          id="bookingUrl"
          name="bookingUrl"
          placeholder="https://misitio.com/reservas"
          defaultValue={defaultValues?.bookingUrl ?? ""}
        />
      </Field>

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700">Comodidades</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="amenities"
                value={key}
                defaultChecked={defaultValues?.amenities?.includes(key) ?? false}
                className="rounded border-zinc-300 text-green-600 focus:ring-green-600"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700">Deportes</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SPORTS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="sports"
                value={key}
                defaultChecked={defaultValues?.sports?.includes(key) ?? false}
                className="rounded border-zinc-300 text-green-600 focus:ring-green-600"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="isPublic"
          value="true"
          defaultChecked={defaultValues?.isPublic ?? false}
          className="rounded border-zinc-300 text-green-600 focus:ring-green-600"
        />
        Lugar público (cancha gratuita/abierta, badge &quot;Lugar público&quot;)
      </label>

      <fieldset className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
        <legend className="px-1 text-sm font-medium text-amber-900">Patrocinio</legend>
        <p className="text-xs text-amber-800">
          El badge &quot;Oficial&quot; y si la cancha aparece destacada en el home dependen
          de su plan pagado — se gestionan en la tarjeta &quot;Plan y cobro&quot; de abajo,
          no acá. Esto solo controla el orden entre canchas ya destacadas y la promo.
        </p>

        <Field label="Prioridad (mayor = aparece primero)" htmlFor="sponsorPriority">
          <Input
            id="sponsorPriority"
            name="sponsorPriority"
            type="number"
            defaultValue={defaultValues?.sponsorPriority ?? 0}
          />
        </Field>

        <Field label="Promo (opcional)" htmlFor="promoText">
          <Input
            id="promoText"
            name="promoText"
            placeholder="Ej: 2x1 los martes"
            defaultValue={defaultValues?.promoText ?? ""}
          />
        </Field>

        <Field label="Código de promo (opcional)" htmlFor="promoCode">
          <Input
            id="promoCode"
            name="promoCode"
            placeholder="KANCHA2X1"
            defaultValue={defaultValues?.promoCode ?? ""}
          />
        </Field>

        <Field label="Promo vigente hasta (opcional)" htmlFor="promoExpiresAt">
          <Input
            id="promoExpiresAt"
            name="promoExpiresAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(defaultValues?.promoExpiresAt)}
          />
        </Field>
      </fieldset>
    </>
  );
}
