"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { updateMatch } from "@/app/actions/matches";
import { CourtPickerMap } from "@/components/court-picker-map";
import { CourtPicker } from "@/components/courts/court-picker";
import { SportChip } from "@/components/courts/sport-chip";
import type { Court } from "@/lib/auth/dal";
import { BANK_OPTIONS } from "@/lib/matches/definitions";
import { SPORTS } from "@/lib/courts/sports";
import { sortCourtsForCreateMatchPicker } from "@/lib/courts/sort";

const INPUT_CLASSNAME =
  "mt-1 w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface focus:border-primary-lime focus:outline-none";
const LABEL_CLASSNAME = "block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditMatchForm({
  matchId,
  courts,
  initialCourtId,
  initialSport,
  initialDatetime,
  initialVibe,
  initialTotalSlots,
  slotsFilled,
  initialPaymentBank,
  initialPaymentPhone,
  initialPaymentCedula,
  initialPaymentAmountBs,
}: {
  matchId: string;
  courts: Court[];
  initialCourtId: string;
  initialSport: string;
  initialDatetime: string;
  initialVibe: string;
  initialTotalSlots: number;
  slotsFilled: number;
  initialPaymentBank: string | null;
  initialPaymentPhone: string | null;
  initialPaymentCedula: string | null;
  initialPaymentAmountBs: number | null;
}) {
  const [state, action, pending] = useActionState(updateMatch, undefined);
  const [sport, setSport] = useState(initialSport);
  const [courtId, setCourtId] = useState(initialCourtId);
  const [vibe, setVibe] = useState(initialVibe);
  const [totalSlots, setTotalSlots] = useState<number | "">(initialTotalSlots);
  const [paymentAmountBs, setPaymentAmountBs] = useState(
    initialPaymentAmountBs != null ? String(initialPaymentAmountBs) : "",
  );
  const selectedCourt = useMemo(() => courts.find((c) => c.id === courtId), [courts, courtId]);
  const availableSports = useMemo(
    () => SPORTS.filter((s) => selectedCourt?.sports?.includes(s.key)),
    [selectedCourt],
  );
  const mappableCourts = courts.filter((c) => c.lat != null && c.lng != null);
  const sortedCourts = sortCourtsForCreateMatchPicker(courts);
  const amountPerPerson =
    paymentAmountBs && totalSlots ? Number(paymentAmountBs) / totalSlots : null;
  const { min: minDatetime, max: maxDatetime } = useMemo(() => {
    const now = new Date();
    const max = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return { min: toDatetimeLocalValue(now), max: toDatetimeLocalValue(max) };
  }, []);

  /** Switching court resets the picked sport if the new court doesn't offer it. */
  function handleCourtChange(nextCourtId: string) {
    setCourtId(nextCourtId);
    const nextCourt = courts.find((c) => c.id === nextCourtId);
    if (!nextCourt?.sports?.includes(sport)) {
      setSport(nextCourt?.sports?.find((s) => SPORTS.some((sp) => sp.key === s)) ?? "");
    }
  }

  return (
    <form action={action} className="w-full space-y-5">
      <input type="hidden" name="matchId" value={matchId} />

      <div>
        <span className={LABEL_CLASSNAME}>Cancha</span>
        {courts.length === 0 ? (
          <p className="mt-1 rounded-lg border border-dashed border-surface-variant px-3 py-4 text-center font-body text-sm text-on-surface-variant">
            Todavía no hay canchas cargadas.
          </p>
        ) : (
          <>
            {mappableCourts.length > 0 && (
              <div className="mt-1 mb-3">
                <CourtPickerMap
                  courts={mappableCourts}
                  selectedId={courtId || null}
                  onSelect={handleCourtChange}
                />
                <p className="mt-1 font-body text-xs text-on-surface-variant">
                  Toca un marcador para elegir la cancha oficial.
                </p>
              </div>
            )}
            <input type="hidden" name="courtId" value={courtId} />
            <div className="mt-1">
              <CourtPicker courts={sortedCourts} selectedId={courtId} onSelect={handleCourtChange} />
            </div>
          </>
        )}
        {state?.errors?.courtId && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.courtId[0]}</p>
        )}
      </div>

      <div>
        <span className={LABEL_CLASSNAME}>Deporte</span>
        <input type="hidden" name="sport" value={sport} />
        {selectedCourt ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {availableSports.map(({ key }) => (
              <SportChip key={key} sportKey={key} active={sport === key} onClick={() => setSport(key)} />
            ))}
          </div>
        ) : (
          <p className="mt-1 rounded-lg border border-dashed border-surface-variant px-3 py-4 text-center font-body text-sm text-on-surface-variant">
            Elige una cancha para ver los deportes disponibles.
          </p>
        )}
        {state?.errors?.sport && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.sport[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="datetime" className={LABEL_CLASSNAME}>
          Fecha y hora
        </label>
        <input
          id="datetime"
          name="datetime"
          type="datetime-local"
          defaultValue={initialDatetime}
          min={minDatetime}
          max={maxDatetime}
          className={INPUT_CLASSNAME}
        />
        {state?.errors?.datetime && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.datetime[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="totalSlots" className={LABEL_CLASSNAME}>
          Cupos totales
        </label>
        <input
          id="totalSlots"
          name="totalSlots"
          type="number"
          min={2}
          max={30}
          value={totalSlots}
          onChange={(e) => setTotalSlots(e.target.value === "" ? "" : Number(e.target.value))}
          className={INPUT_CLASSNAME}
        />
        <p className="mt-1 font-body text-xs text-on-surface-variant">
          {slotsFilled} confirmados — no puedes bajar de ese número.
        </p>
        {state?.errors?.totalSlots && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.totalSlots[0]}</p>
        )}
      </div>

      <fieldset>
        <legend className={LABEL_CLASSNAME}>Vibra</legend>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 font-body text-on-surface">
            <input
              type="radio"
              name="vibe"
              value="relajado"
              checked={vibe === "relajado"}
              onChange={() => setVibe("relajado")}
              className="accent-primary-lime"
            />
            Relajado
          </label>
          <label className="flex items-center gap-2 font-body text-on-surface">
            <input
              type="radio"
              name="vibe"
              value="competitivo"
              checked={vibe === "competitivo"}
              onChange={() => setVibe("competitivo")}
              className="accent-primary-lime"
            />
            Competitivo
          </label>
        </div>
        {state?.errors?.vibe && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.vibe[0]}</p>
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-surface-variant/50 bg-surface-container p-3">
        <legend className={`px-1 ${LABEL_CLASSNAME}`}>Pago móvil (opcional)</legend>
        <p className="font-body text-xs text-on-surface-variant">
          Si vas a repartir el costo de la cancha, deja tus datos de pago móvil.
        </p>

        <div>
          <label htmlFor="paymentBank" className={LABEL_CLASSNAME}>
            Banco
          </label>
          <select
            id="paymentBank"
            name="paymentBank"
            defaultValue={initialPaymentBank ?? ""}
            className={INPUT_CLASSNAME}
          >
            <option value="">— Sin pago móvil —</option>
            {BANK_OPTIONS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
          {state?.errors?.paymentBank && (
            <p className="mt-1 font-body text-sm text-dark-error">{state.errors.paymentBank[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="paymentPhone" className={LABEL_CLASSNAME}>
            Teléfono
          </label>
          <input
            id="paymentPhone"
            name="paymentPhone"
            type="tel"
            defaultValue={initialPaymentPhone ?? ""}
            placeholder="0412-1234567"
            className={`${INPUT_CLASSNAME} placeholder:text-on-surface-variant/60`}
          />
          {state?.errors?.paymentPhone && (
            <p className="mt-1 font-body text-sm text-dark-error">{state.errors.paymentPhone[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="paymentCedula" className={LABEL_CLASSNAME}>
            Cédula
          </label>
          <input
            id="paymentCedula"
            name="paymentCedula"
            type="text"
            defaultValue={initialPaymentCedula ?? ""}
            placeholder="V-12345678"
            className={`${INPUT_CLASSNAME} placeholder:text-on-surface-variant/60`}
          />
          {state?.errors?.paymentCedula && (
            <p className="mt-1 font-body text-sm text-dark-error">{state.errors.paymentCedula[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="paymentAmountBs" className={LABEL_CLASSNAME}>
            Monto total (Bs)
          </label>
          <input
            id="paymentAmountBs"
            name="paymentAmountBs"
            type="number"
            min={0}
            step="0.01"
            value={paymentAmountBs}
            onChange={(e) => setPaymentAmountBs(e.target.value)}
            className={INPUT_CLASSNAME}
          />
          {amountPerPerson !== null && (
            <p className="mt-1 font-body text-xs text-on-surface-variant">
              ≈ {amountPerPerson.toLocaleString("es-VE", { maximumFractionDigits: 2 })} Bs por
              persona ({totalSlots} cupos)
            </p>
          )}
          {state?.errors?.paymentAmountBs && (
            <p className="mt-1 font-body text-sm text-dark-error">{state.errors.paymentAmountBs[0]}</p>
          )}
        </div>
      </fieldset>

      {state?.message && <p className="font-body text-sm text-dark-error">{state.message}</p>}

      <button
        disabled={pending}
        type="submit"
        className="w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
