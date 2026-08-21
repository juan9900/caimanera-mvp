import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { verifySession, getCurrentUserProfile, getCourt, getMyRatingForCourt } from "@/lib/auth/dal";
import { CourtsMap } from "@/components/courts-map";
import { CourtHero } from "@/components/courts/court-hero";
import { AmenitiesShowcase } from "@/components/courts/amenities-showcase";
import { OfficialUpsell } from "@/components/courts/official-upsell";
import { CourtContactActions, CourtPromo } from "@/components/courts/court-cta";
import { RatingStars } from "@/components/courts/rating-stars";
import { RateCourt } from "@/components/courts/rate-court";
import { getSport, SportIcon } from "@/lib/courts/sports";
import { formatTodayHours } from "@/lib/courts/hours";

function isSponsored(court: { sponsored_until: string | null }): boolean {
  return court.sponsored_until != null && new Date(court.sponsored_until) > new Date();
}

function isPromoActive(court: { promo_text: string | null; promo_expires_at: string | null }): boolean {
  if (!court.promo_text) return false;
  return court.promo_expires_at == null || new Date(court.promo_expires_at) > new Date();
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-display text-xl font-bold text-on-surface">{children}</h2>;
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
  const myRating = await getMyRatingForCourt(court.id);

  // WhatsApp, Reserva, Comodidades y la galería de fotos son beneficios
  // exclusivos de las canchas oficiales (partners de pago) — ver
  // components/courts/official-upsell.tsx para el mensaje a las demás.
  if (court.is_official) {
    const galleryPhotos = court.photos?.slice(1) ?? [];

    return (
      <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
        <CourtHero
          name={court.name}
          address={court.address}
          imageUrl={court.photos?.[0] ?? null}
          logoUrl={court.logo_url}
          ratingAvg={court.rating_avg}
          ratingCount={court.rating_count}
          sponsored={sponsored}
        />

        <div className="mt-4 flex flex-col gap-6">
          <CourtContactActions
            courtId={court.id}
            contactPhone={court.contact_phone}
            whatsappUrl={court.whatsapp_url}
            bookingUrl={court.booking_url}
            lat={court.lat}
            lng={court.lng}
            courtName={court.name}
          />

          {isPromoActive(court) && (
            <CourtPromo courtId={court.id} promoText={court.promo_text!} promoCode={court.promo_code} />
          )}

          {court.amenities.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Comodidades</SectionTitle>
              <AmenitiesShowcase amenities={court.amenities} />
            </section>
          )}

          {court.sports.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Deportes</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {court.sports.map((sportKey) => {
                  const sport = getSport(sportKey);
                  if (!sport) return null;
                  return (
                    <span
                      key={sportKey}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary-lime bg-primary-lime px-3 py-1.5 font-label text-xs font-bold uppercase tracking-wide text-on-primary"
                    >
                      <SportIcon sport={sportKey} size={13} />
                      {sport.label}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <SectionTitle>Información</SectionTitle>
            <dl className="divide-y divide-surface-variant/50 rounded-xl border border-surface-variant/50 bg-surface-container font-body text-sm">
              <div className="flex justify-between px-4 py-3">
                <dt className="text-on-surface-variant">Horario</dt>
                <dd className="text-on-surface">
                  {court.opens_at && court.closes_at
                    ? formatTodayHours(court)
                    : (court.schedule ?? "No especificado")}
                </dd>
              </div>
              {court.address && (
                <div className="flex justify-between px-4 py-3">
                  <dt className="text-on-surface-variant">Dirección</dt>
                  <dd className="text-right text-on-surface">{court.address}</dd>
                </div>
              )}
              <div className="flex justify-between px-4 py-3">
                <dt className="text-on-surface-variant">Contacto</dt>
                <dd className="text-on-surface">{court.contact_phone ?? "No especificado"}</dd>
              </div>
            </dl>
          </section>

          {galleryPhotos.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Fotos</SectionTitle>
              <div className="flex gap-2 overflow-x-auto">
                {galleryPhotos.map((url) => (
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
            </section>
          )}

          <section className="flex flex-col gap-3">
            <SectionTitle>Ubicación</SectionTitle>
            <CourtsMap courts={[court]} preferredSports={profile.sport_preferences} />
          </section>

          <section className="flex flex-col gap-3">
            <SectionTitle>Valoraciones</SectionTitle>
            <RatingStars avg={court.rating_avg} count={court.rating_count} variant="detail" />
            <RateCourt courtId={court.id} myRating={myRating} />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <Link
        href="/mapa"
        className="mb-4 inline-flex items-center gap-1 font-body text-sm text-on-surface-variant hover:text-primary-lime"
      >
        <ArrowLeft aria-hidden size={16} />
        Volver al mapa
      </Link>

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
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{court.name}</h1>
            {sponsored && (
              <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 font-label text-xs font-bold text-primary-lime">
                Patrocinado
              </span>
            )}
          </div>
          {court.address && (
            <span className="flex items-center gap-1 font-body text-xs text-on-surface-variant">
              <MapPin aria-hidden size={12} />
              {court.address}
            </span>
          )}
          <div className="mt-1">
            <RatingStars avg={court.rating_avg} count={court.rating_count} variant="compact" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${court.lat},${court.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-lg border border-surface-variant px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-surface active:scale-[0.98]"
        >
          Cómo llegar
        </a>
      </div>

      <CourtsMap courts={[court]} />

      <div className="mt-4 flex flex-col gap-3">
        <RatingStars avg={court.rating_avg} count={court.rating_count} variant="detail" />
        <RateCourt courtId={court.id} myRating={myRating} />
      </div>

      <OfficialUpsell />
    </div>
  );
}
