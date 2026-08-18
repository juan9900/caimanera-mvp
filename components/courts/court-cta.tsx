"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Normalizes a Venezuelan local number ("0412-1234567") to E.164-ish digits for wa.me ("584121234567"). */
function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `58${digits.slice(1)}` : digits;
}

function logEvent(courtId: string, type: string) {
  // Fire-and-forget: never block the user's action on analytics.
  createClient()
    .rpc("log_court_event", { p_court_id: courtId, p_type: type })
    .then(
      () => {},
      () => {},
    );
}

/**
 * WhatsApp + "Reservar" + "Cómo llegar" action buttons for a court's detail
 * page, each logging a `court_events` row on click. The WhatsApp link prefers
 * an explicit `whatsappUrl` (pasted by the admin — some places already hand
 * out a ready wa.me/short link); falls back to deriving one from
 * `contactPhone`. "Reservar" only shows for courts with their own booking
 * site — places that take reservations over WhatsApp just use that button.
 */
export function CourtContactActions({
  courtId,
  contactPhone,
  whatsappUrl,
  bookingUrl,
  lat,
  lng,
  courtName,
}: {
  courtId: string;
  contactPhone: string | null;
  whatsappUrl: string | null;
  bookingUrl: string | null;
  lat: number;
  lng: number;
  courtName: string;
}) {
  const resolvedWhatsappUrl =
    whatsappUrl ||
    (contactPhone
      ? `https://wa.me/${toWhatsAppDigits(contactPhone)}?text=${encodeURIComponent(
          `Hola, quiero info sobre ${courtName}`
        )}`
      : null);

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {resolvedWhatsappUrl && (
        <a
          href={resolvedWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => logEvent(courtId, "whatsapp")}
          className="rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)]"
        >
          WhatsApp
        </a>
      )}
      {bookingUrl && (
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => logEvent(courtId, "booking")}
          className="rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)]"
        >
          Reservar
        </a>
      )}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => logEvent(courtId, "directions")}
        className="rounded-lg border border-surface-variant px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-surface"
      >
        Cómo llegar
      </a>
    </div>
  );
}

/** Promo block with a "copy code" button that logs a `promo_copy` event. */
export function CourtPromo({
  courtId,
  promoText,
  promoCode,
}: {
  courtId: string;
  promoText: string;
  promoCode: string | null;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-primary-lime/50 bg-secondary-container/20 p-4">
      <p className="font-body text-sm font-medium text-on-secondary-container">{promoText}</p>
      {promoCode && (
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(promoCode).catch(() => {});
            logEvent(courtId, "promo_copy");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="mt-2 rounded-lg border border-primary-lime/50 px-3 py-1.5 font-label text-xs font-bold text-primary-lime"
        >
          {copied ? "¡Copiado!" : `Copiar código: ${promoCode}`}
        </button>
      )}
    </div>
  );
}
