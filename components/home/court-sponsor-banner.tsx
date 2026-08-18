// Same standing invite as the carousel's dashed card, but as a full-width
// closing banner — mirrors the "Descubrimiento visual" mock, which pairs a
// compact in-carousel card with a larger CTA at the end of the page.
const SPONSOR_INQUIRY_MAILTO =
  "mailto:juanluislauretta@gmail.com?subject=Quiero anunciar mi cancha";

/** Closing "¿Tienes una cancha?" banner, inviting court owners to sponsor a featured slot. */
export function CourtSponsorBanner() {
  return (
    <section className="px-4">
      <a
        href={SPONSOR_INQUIRY_MAILTO}
        className="block rounded-xl border border-surface-variant bg-surface-container p-6"
      >
        <p className="font-display text-lg font-bold text-primary-lime">¿Tienes una cancha?</p>
        <p className="mt-2 max-w-[280px] font-body text-sm text-on-surface">
          Anúnciala aquí y llega a cientos de jugadores cada semana.
        </p>
        <span className="mt-3 inline-block font-label text-xs font-bold text-on-surface underline decoration-primary-lime underline-offset-4">
          Conoce más
        </span>
      </a>
    </section>
  );
}
