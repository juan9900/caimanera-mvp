import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { verifySession, getCurrentUserProfile, getCourt } from "@/lib/auth/dal";
import { CourtsMap } from "@/components/courts-map";
import { AmenityIcons } from "@/components/courts/amenity-icons";
import { CourtContactActions, CourtPromo } from "@/components/courts/court-cta";

function isSponsored(court: { sponsored_until: string | null }): boolean {
  return court.sponsored_until != null && new Date(court.sponsored_until) > new Date();
}

function isPromoActive(court: { promo_text: string | null; promo_expires_at: string | null }): boolean {
  if (!court.promo_text) return false;
  return court.promo_expires_at == null || new Date(court.promo_expires_at) > new Date();
}

export default async function CourtDetailPage(
  props: PageProps<"/canchas/[id]">
) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const { id } = await props.params;
  const court = await getCourt(id);
  if (!court) notFound();

  const sponsored = isSponsored(court);

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <div className="mb-4 flex items-center gap-3">
        {court.logo_url && (
          <Image
            src={court.logo_url}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-full border border-surface-variant object-cover"
            unoptimized
          />
        )}
        <h1 className="font-display text-2xl font-bold">{court.name}</h1>
        {sponsored && (
          <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 font-label text-xs font-bold text-primary-lime">
            Patrocinado
          </span>
        )}
      </div>

      {court.photos && court.photos.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {court.photos.map((url) => (
            <Image
              key={url}
              src={url}
              alt={court.name}
              width={240}
              height={160}
              className="h-40 w-60 shrink-0 rounded-xl object-cover"
              unoptimized
            />
          ))}
        </div>
      )}

      {isPromoActive(court) && (
        <CourtPromo courtId={court.id} promoText={court.promo_text!} promoCode={court.promo_code} />
      )}

      <CourtsMap courts={[court]} />

      <dl className="mt-6 divide-y divide-surface-variant/50 rounded-xl border border-surface-variant/50 bg-surface-container font-body text-sm">
        <div className="flex justify-between px-4 py-3">
          <dt className="text-on-surface-variant">Horario</dt>
          <dd className="text-on-surface">{court.schedule ?? "No especificado"}</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-on-surface-variant">Contacto</dt>
          <dd className="text-on-surface">
            {court.contact_phone ?? "No especificado"}
          </dd>
        </div>
        {court.amenities.length > 0 && (
          <div className="px-4 py-3">
            <dt className="mb-2 text-on-surface-variant">Comodidades</dt>
            <dd>
              <AmenityIcons amenities={court.amenities} size="lg" tone="dark" />
            </dd>
          </div>
        )}
      </dl>

      <CourtContactActions
        courtId={court.id}
        contactPhone={court.contact_phone}
        whatsappUrl={court.whatsapp_url}
        bookingUrl={court.booking_url}
        lat={court.lat}
        lng={court.lng}
        courtName={court.name}
      />
    </div>
  );
}
