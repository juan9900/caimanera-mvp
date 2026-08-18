"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MapPin, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FeaturedCourt } from "@/lib/matches/home";
import { AmenityIcons } from "@/components/courts/amenity-icons";

// TODO: swap for a dedicated sales inbox/WhatsApp once there's one.
const SPONSOR_INQUIRY_MAILTO =
  "mailto:juanluislauretta@gmail.com?subject=Quiero anunciar mi cancha";

function isPromoActive(court: { promo_text: string | null; promo_expires_at: string | null }): boolean {
  if (!court.promo_text) return false;
  return court.promo_expires_at == null || new Date(court.promo_expires_at) > new Date();
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
  const image = court.photos?.[0] ?? court.logo_url ?? null;
  const promo = isPromoActive(court) ? court.promo_text : null;

  return (
    <Link
      href={`/canchas/${court.id}`}
      onClick={() => logCourtEvent(court.id, "click")}
      className="relative flex w-[85vw] max-w-[320px] shrink-0 snap-center flex-col overflow-hidden rounded-xl bg-surface-container shadow-md transition-transform active:scale-[0.98]"
    >
      <div
        className="h-48 w-full bg-surface-variant bg-cover bg-center"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      >
        <div className="h-full w-full bg-gradient-to-t from-surface-container to-transparent" />
      </div>
      <div className="p-4">
        <p className="truncate font-display text-lg font-bold text-on-surface">{court.name}</p>
        <p className="mt-1 flex items-center gap-1 truncate font-label text-xs text-on-surface-variant">
          <MapPin aria-hidden size={14} />
          {distanceLabel ? `${distanceLabel} · Maracaibo` : "Maracaibo"}
        </p>
        <p className="mt-2 truncate font-body text-sm text-primary-lime">
          {promo ??
            (openMatchCount > 0
              ? `${openMatchCount} ${openMatchCount === 1 ? "partido abierto" : "partidos abiertos"} ahora mismo`
              : "Cancha destacada")}
        </p>
        <AmenityIcons amenities={court.amenities} size="sm" tone="dark" className="mt-3" />
      </div>
    </Link>
  );
}

/** Standing invite for court owners to sponsor a slot — always in the carousel, not just when it's empty. */
function SponsorInquiryCard() {
  return (
    <a
      href={SPONSOR_INQUIRY_MAILTO}
      className="flex w-[85vw] max-w-[320px] shrink-0 snap-center flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-secondary-container bg-secondary-container/20 p-4 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
        <Megaphone aria-hidden size={24} />
      </span>
      <div>
        <p className="font-display text-lg font-bold text-on-secondary-container">¿Tienes una cancha?</p>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Anúnciala aquí y llega a cientos de jugadores cada semana.
        </p>
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
  if (courts.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 pt-2">
      <h2 className="px-4 font-display text-xl font-bold text-on-surface">Canchas Destacadas</h2>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pl-4 pb-1">
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
