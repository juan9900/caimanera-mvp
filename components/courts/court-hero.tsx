import Image from "next/image";
import { ArrowLeft, BadgeCheck, MapPin, MapPinned } from "lucide-react";
import { RatingStars } from "@/components/courts/rating-stars";
import { BackLink } from "@/components/back-link";

/**
 * Full-bleed photo hero for an official court's detail page — the premium
 * treatment that makes paying for "Oficial" status visually worth it. Falls
 * back to a flat color block with the logo when the court has no photo yet,
 * so a partner who hasn't uploaded pictures still gets the same layout.
 */
export function CourtHero({
  name,
  address,
  imageUrl,
  logoUrl,
  ratingAvg,
  ratingCount,
  sponsored,
  isPublic,
}: {
  name: string;
  address: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  sponsored: boolean;
  isPublic?: boolean;
}) {
  return (
    <div className="relative -mx-4 -mt-6 h-64 w-[calc(100%+2rem)] overflow-hidden bg-surface-container sm:h-80">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          unoptimized
          priority
        />
      ) : logoUrl ? (
        <div className="absolute inset-x-0 top-10 flex justify-center">
          <Image
            src={logoUrl}
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 rounded-full border border-surface-variant object-cover opacity-80"
            unoptimized
          />
        </div>
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

      <BackLink
        fallbackHref="/mapa"
        className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-surface/60 px-3 py-1.5 font-body text-sm text-on-surface backdrop-blur-sm active:scale-[0.98]"
      >
        <ArrowLeft aria-hidden size={16} />
        Volver
      </BackLink>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-4 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-secondary-container/90 px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide text-on-secondary-container">
            <BadgeCheck aria-hidden size={12} />
            Oficial
          </span>
          {sponsored && (
            <span className="rounded-full bg-secondary-container/30 px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide text-primary-lime">
              Patrocinado
            </span>
          )}
          {isPublic && (
            <span className="flex items-center gap-1 rounded-full bg-primary-lime/90 px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide text-on-primary">
              <MapPinned aria-hidden size={12} />
              Lugar público
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold text-on-surface sm:text-3xl">{name}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <RatingStars avg={ratingAvg} count={ratingCount} variant="compact" />
          {address && (
            <span className="flex items-center gap-1 font-body text-xs text-on-surface-variant">
              <MapPin aria-hidden size={12} />
              {address}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
