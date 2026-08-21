import { BadgeCheck, MessageCircle, CalendarCheck, Sparkles, Star } from "lucide-react";

const BENEFITS = [
  { Icon: MessageCircle, label: "Botón directo de WhatsApp" },
  { Icon: CalendarCheck, label: "Botón directo a tu sistema de agendamiento" },
  { Icon: Sparkles, label: "Comodidades y fotos destacadas" },
  { Icon: Star, label: "Posición destacada en el home, la lista de canchas y el mapa" },
];

/**
 * Shown on non-official courts' detail pages in place of the WhatsApp/
 * Reservar/Comodidades/Fotos sections (those are gated to `is_official`
 * courts — see `app/canchas/[id]/page.tsx`). Nudges whoever runs the venue
 * toward becoming a paid partner by naming exactly what they'd unlock.
 *
 * No button on the site uses the lime "glow" shadow (shadow-[...rgba(195,244,0,...)])
 * anymore — keep new CTAs flat, without a shadow/gradient, to match.
 */
export function OfficialUpsell() {
  return (
    <div className="mt-4 rounded-2xl border border-primary-lime/30 bg-gradient-to-br from-surface-container to-secondary-container/10 p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container/30">
          <BadgeCheck aria-hidden size={18} className="text-primary-lime" />
        </span>
        <p className="font-display text-base font-bold text-on-surface">¿Administras esta cancha?</p>
      </div>
      <p className="mt-2 font-body text-sm text-on-surface-variant">
        Hazte partner oficial y desbloquea:
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {BENEFITS.map(({ Icon, label }) => (
          <li key={label} className="flex items-center gap-2 font-body text-sm text-on-surface">
            <Icon aria-hidden size={14} className="shrink-0 text-primary-lime" />
            {label}
          </li>
        ))}
      </ul>
      <a
        href="https://wa.me/message"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary active:scale-[0.98]"
      >
        Quiero ser partner
      </a>
    </div>
  );
}
