"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FeaturedCourt } from "@/lib/matches/home";
import { AmenityIcons } from "@/components/courts/amenity-icons";
import { RatingStars } from "@/components/courts/rating-stars";

const SPONSOR_INQUIRY_WHATSAPP =
  "https://wa.me/584246023604?text=Quiero%20anunciar%20mi%20cancha%20en%20Kancha";

function isPromoActive(court: {
  promo_text: string | null;
  promo_expires_at: string | null;
}): boolean {
  if (!court.promo_text) return false;
  return (
    court.promo_expires_at == null ||
    new Date(court.promo_expires_at) > new Date()
  );
}

function logCourtEvent(courtId: string, type: string) {
  createClient()
    .rpc("log_court_event", { p_court_id: courtId, p_type: type })
    .then(
      () => {},
      () => {},
    );
}

/** Logs one `impression` per court per browser session (deduped via sessionStorage). */
function useImpressionOnce(courtId: string) {
  useEffect(() => {
    const key = `court_impression_${courtId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    logCourtEvent(courtId, "impression");
  }, [courtId]);
}

function SponsoredCourtCard({
  court,
  openMatchCount,
  distanceLabel,
}: FeaturedCourt & { distanceLabel?: string }) {
  useImpressionOnce(court.id);
  const coverPhoto = court.photos?.[0] ?? null;
  const promo = isPromoActive(court) ? court.promo_text : null;

  return (
    <Link
      href={`/canchas/${court.id}`}
      onClick={() => logCourtEvent(court.id, "click")}
      className="relative flex w-[85vw] max-w-[320px] shrink-0 snap-center flex-col overflow-hidden rounded-xl bg-surface-container shadow-md transition-transform active:scale-[0.98]"
    >
      <div
        className="relative h-48 w-full bg-surface-variant bg-cover bg-center"
        style={
          coverPhoto ? { backgroundImage: `url(${coverPhoto})` } : undefined
        }
      >
        {court.logo_url && (
          <Image
            src={court.logo_url}
            alt=""
            width={200}
            height={200}
            unoptimized
            className="absolute left-4 top-4 h-[200px] w-[200px] object-contain object-top drop-shadow-md"
          />
        )}
      </div>
      <div className="p-4">
        <p className="truncate font-display text-lg font-bold text-on-surface">
          {court.name}
        </p>
        <p className="mt-1 flex items-center gap-1.5 truncate font-label text-xs text-on-surface-variant">
          <span className="flex items-center gap-1 truncate">
            <MapPin aria-hidden size={14} />
            {distanceLabel ? `${distanceLabel} · Maracaibo` : "Maracaibo"}
          </span>
          <RatingStars avg={court.rating_avg} count={court.rating_count} />
        </p>
        <p className="mt-2 truncate font-body text-sm text-primary-lime">
          {promo ??
            (openMatchCount > 0
              ? `${openMatchCount} ${openMatchCount === 1 ? "partido abierto" : "partidos abiertos"} ahora mismo`
              : "Cancha oficial")}
        </p>
        <AmenityIcons
          amenities={court.amenities}
          size="sm"
          tone="dark"
          className="mt-3"
        />
      </div>
    </Link>
  );
}

/** Standing invite for court owners to sponsor a slot — always in the carousel, not just when it's empty. */
function SponsorInquiryCard() {
  return (
    <a
      href={SPONSOR_INQUIRY_WHATSAPP}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-[85vw] max-w-[320px] shrink-0 snap-center flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-secondary-container bg-secondary-container/20 p-4 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <Megaphone aria-hidden size={24} />
      </span>
      <div>
        <p className="font-display text-lg font-bold text-on-secondary-container">
          ¿Tienes una cancha?
        </p>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Anúnciala aquí y llega a cientos de jugadores cada semana.
        </p>
        <span className="mt-2 inline-block font-label text-xs font-bold text-on-secondary-container underline decoration-primary-lime underline-offset-4">
          Conoce más
        </span>
      </div>
    </a>
  );
}

/**
 * Lead section of the home screen: horizontal carousel of paying (sponsored)
 * and free `is_official` courts (see `getOfficialCourts`), ranked by
 * `sortCourtsForPicker` so sponsorship buys top placement. Always ends with
 * a standing invite for other court owners to sponsor a slot too.
 */
export function FeaturedCourtsCarousel({
  courts,
  distanceByCourtId,
}: {
  courts: FeaturedCourt[];
  distanceByCourtId?: Map<string, string>;
}) {
  return (
    <section className="flex flex-col gap-3 pt-2">
      <h2 className="px-4 font-display text-xl font-bold text-on-surface">
        Canchas Oficiales
      </h2>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pl-4 pb-1">
        {courts.map((featured) => (
          <SponsoredCourtCard
            key={featured.court.id}
            {...featured}
            distanceLabel={distanceByCourtId?.get(featured.court.id)}
          />
        ))}
        <SponsorInquiryCard />
        <div className="w-1 shrink-0" aria-hidden />
      </div>
    </section>
  );
}
