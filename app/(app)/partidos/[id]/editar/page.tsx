import { redirect, notFound } from "next/navigation";
import { verifySession, getCurrentUserProfile, getMatch, getCourts } from "@/lib/auth/dal";
import { EditMatchForm } from "./edit-match-form";

const EDITABLE_STATUSES = ["abierto", "completo"];

/** Venezuela runs on VET (UTC-4) year-round, no DST — safe to hardcode the offset
 * rather than depend on the server's local timezone when formatting for a
 * `datetime-local` input, which expects wall-clock time with no zone info. */
function toVenezuelaLocalInputValue(isoDatetime: string): string {
  const utcMs = new Date(isoDatetime).getTime();
  const vetMs = utcMs - 4 * 60 * 60 * 1000;
  return new Date(vetMs).toISOString().slice(0, 16);
}

export default async function EditarPartidoPage(
  props: PageProps<"/partidos/[id]/editar">,
) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const { id } = await props.params;
  const match = await getMatch(id);
  if (!match) notFound();
  if (match.organizer_id !== session.userId) notFound();
  if (!EDITABLE_STATUSES.includes(match.status)) redirect(`/partidos/${id}`);

  const courts = await getCourts();

  return (
    <div className="flex flex-1 flex-col bg-surface px-4 py-6 text-on-surface">
      <h1 className="mb-6 font-display text-2xl font-bold">Editar partido</h1>

      {courts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center font-body text-on-surface-variant">
          Todavía no hay canchas disponibles.
        </p>
      ) : (
        <EditMatchForm
          matchId={match.id}
          courts={courts}
          initialCourtId={match.court_id}
          initialSport={match.sport}
          initialDatetime={toVenezuelaLocalInputValue(match.datetime)}
          initialVibe={match.vibe}
          initialTotalSlots={match.total_slots}
          slotsFilled={match.slots_filled}
          initialPaymentBank={match.payment_bank}
          initialPaymentPhone={match.payment_phone}
          initialPaymentCedula={match.payment_cedula}
          initialPaymentAmountBs={match.payment_amount_bs}
        />
      )}
    </div>
  );
}
