import { AMENITIES } from "@/lib/courts/amenities";
import { SPORTS } from "@/lib/courts/sports";
import type { AddCourtFormState } from "@/lib/courts/definitions";

type CourtFormErrors = NonNullable<AddCourtFormState>["errors"];

/** Turns a stored `sponsored_until`/`promo_expires_at` ISO string into a `datetime-local` input value. */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

/**
 * Sponsorship/amenity fields shared by the "add court" and "edit court" admin
 * forms: logo/photos URLs, amenity checkboxes, official flag, sponsorship
 * window + priority, and promo. Field `name`s match `AddCourtFormSchema` /
 * `EditCourtFormSchema` so both actions can read them via `formData.get(...)`.
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
    isOfficial?: boolean;
    sponsoredUntil?: string | null;
    sponsorPriority?: number;
    promoText?: string | null;
    promoCode?: string | null;
    promoExpiresAt?: string | null;
  };
  errors?: CourtFormErrors;
}) {
  return (
    <>
      <div>
        <label htmlFor="logoUrl" className="block text-sm font-medium text-zinc-700">
          Logo (URL, opcional)
        </label>
        <input
          id="logoUrl"
          name="logoUrl"
          placeholder="https://…"
          defaultValue={defaultValues?.logoUrl ?? ""}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        {errors?.logoUrl && <p className="mt-1 text-sm text-red-600">{errors.logoUrl[0]}</p>}
      </div>

      <div>
        <label htmlFor="photosText" className="block text-sm font-medium text-zinc-700">
          Fotos (una URL por línea, opcional)
        </label>
        <textarea
          id="photosText"
          name="photosText"
          rows={3}
          placeholder={"https://…\nhttps://…"}
          defaultValue={defaultValues?.photos?.join("\n") ?? ""}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="whatsappUrl" className="block text-sm font-medium text-zinc-700">
          Link de WhatsApp (opcional)
        </label>
        <input
          id="whatsappUrl"
          name="whatsappUrl"
          placeholder="https://wa.me/584121234567"
          defaultValue={defaultValues?.whatsappUrl ?? ""}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Si no lo llenas, se usa el teléfono de contacto de arriba.
        </p>
        {errors?.whatsappUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.whatsappUrl[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="bookingUrl" className="block text-sm font-medium text-zinc-700">
          Link de reserva (opcional)
        </label>
        <input
          id="bookingUrl"
          name="bookingUrl"
          placeholder="https://misitio.com/reservas"
          defaultValue={defaultValues?.bookingUrl ?? ""}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Para canchas con su propio sitio de reservas (si reservan por WhatsApp, deja
          esto vacío).
        </p>
        {errors?.bookingUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.bookingUrl[0]}</p>
        )}
      </div>

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
          name="isOfficial"
          value="true"
          defaultChecked={defaultValues?.isOfficial ?? false}
          className="rounded border-zinc-300 text-green-600 focus:ring-green-600"
        />
        Cancha verificada (badge &quot;Oficial&quot;)
      </label>

      <fieldset className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
        <legend className="px-1 text-sm font-medium text-amber-900">Patrocinio</legend>
        <p className="text-xs text-amber-800">
          Mientras esté vigente, la cancha aparece en el banner del home y se destaca
          al crear partido.
        </p>

        <div>
          <label htmlFor="sponsoredUntil" className="block text-sm font-medium text-zinc-700">
            Patrocinada hasta
          </label>
          <input
            id="sponsoredUntil"
            name="sponsoredUntil"
            type="datetime-local"
            defaultValue={toDatetimeLocal(defaultValues?.sponsoredUntil)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
          />
          {errors?.sponsoredUntil && (
            <p className="mt-1 text-sm text-red-600">{errors.sponsoredUntil[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="sponsorPriority" className="block text-sm font-medium text-zinc-700">
            Prioridad (mayor = aparece primero)
          </label>
          <input
            id="sponsorPriority"
            name="sponsorPriority"
            type="number"
            defaultValue={defaultValues?.sponsorPriority ?? 0}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="promoText" className="block text-sm font-medium text-zinc-700">
            Promo (opcional)
          </label>
          <input
            id="promoText"
            name="promoText"
            placeholder="Ej: 2x1 los martes"
            defaultValue={defaultValues?.promoText ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="promoCode" className="block text-sm font-medium text-zinc-700">
            Código de promo (opcional)
          </label>
          <input
            id="promoCode"
            name="promoCode"
            placeholder="KANCHA2X1"
            defaultValue={defaultValues?.promoCode ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="promoExpiresAt" className="block text-sm font-medium text-zinc-700">
            Promo vigente hasta (opcional)
          </label>
          <input
            id="promoExpiresAt"
            name="promoExpiresAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(defaultValues?.promoExpiresAt)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
          />
        </div>
      </fieldset>
    </>
  );
}
