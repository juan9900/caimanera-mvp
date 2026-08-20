"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { createMatch } from "@/app/actions/matches";
import { CourtPickerMap } from "@/components/court-picker-map";
import { CourtPicker } from "@/components/courts/court-picker";
import { SportChip } from "@/components/courts/sport-chip";
import { VisibilityToggle } from "@/components/matches/visibility-toggle";
import type { Court } from "@/lib/auth/dal";
import { BANK_OPTIONS } from "@/lib/matches/definitions";
import { SPORTS } from "@/lib/courts/sports";
import { sortCourtsForCreateMatchPicker } from "@/lib/courts/sort";

const INPUT_CLASSNAME =
  "mt-1 w-full rounded-lg border border-surface-variant bg-surface-container px-3 py-2 font-body text-on-surface focus:border-primary-lime focus:outline-none";
const LABEL_CLASSNAME = "block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant";

export function CreateMatchForm({ courts }: { courts: Court[] }) {
  const [state, action, pending] = useActionState(createMatch, undefined);
  const [sport, setSport] = useState("futbol");
  const [courtId, setCourtId] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [totalSlots, setTotalSlots] = useState(10);
  const [paymentAmountBs, setPaymentAmountBs] = useState("");
  const courtsForSport = useMemo(
    () => courts.filter((c) => c.sports?.includes(sport)),
    [courts, sport],
  );
  const mappableCourts = courtsForSport.filter((c) => c.lat != null && c.lng != null);
  const sortedCourts = sortCourtsForCreateMatchPicker(courtsForSport);
  const amountPerPerson =
    paymentAmountBs && totalSlots > 0
      ? Number(paymentAmountBs) / totalSlots
      : null;

  /** Switching sport clears the picked court if it doesn't offer the new one. */
  function handleSportChange(nextSport: string) {
    setSport(nextSport);
    setCourtId((current) =>
      courts.find((c) => c.id === current)?.sports?.includes(nextSport) ? current : "",
    );
  }

  return (
    <form action={action} className="w-full space-y-5">
      <div>
        <span className={LABEL_CLASSNAME}>Visibilidad</span>
        <input type="hidden" name="isPublic" value={isPublic ? "true" : "false"} />
        <div className="mt-1">
          <VisibilityToggle value={isPublic} onChange={setIsPublic} />
        </div>
      </div>

      <div>
        <span className={LABEL_CLASSNAME}>Deporte</span>
        <input type="hidden" name="sport" value={sport} />
        <div className="mt-1 flex flex-wrap gap-2">
          {SPORTS.map(({ key }) => (
            <SportChip key={key} sportKey={key} active={sport === key} onClick={() => handleSportChange(key)} />
          ))}
        </div>
        {state?.errors?.sport && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.sport[0]}</p>
        )}
      </div>

      <div>
        <span className={LABEL_CLASSNAME}>Cancha</span>
        {courtsForSport.length === 0 ? (
          <p className="mt-1 rounded-lg border border-dashed border-surface-variant px-3 py-4 text-center font-body text-sm text-on-surface-variant">
            Todavía no hay canchas cargadas para este deporte.
          </p>
        ) : (
          <>
            {mappableCourts.length > 0 && (
              <div className="mt-1 mb-3">
                <CourtPickerMap
                  courts={mappableCourts}
                  selectedId={courtId || null}
                  onSelect={setCourtId}
                />
                <p className="mt-1 font-body text-xs text-on-surface-variant">
                  Toca un marcador para elegir la cancha oficial.
                </p>
              </div>
            )}
            <input type="hidden" name="courtId" value={courtId} />
            <div className="mt-1">
              <CourtPicker courts={sortedCourts} selectedId={courtId} onSelect={setCourtId} />
            </div>
          </>
        )}
        {state?.errors?.courtId && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.courtId[0]}</p>
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
          onChange={(e) => setTotalSlots(Number(e.target.value))}
          className={INPUT_CLASSNAME}
        />
        {state?.errors?.totalSlots && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.totalSlots[0]}</p>
        )}
      </div>

      <fieldset>
        <legend className={LABEL_CLASSNAME}>Vibra</legend>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 font-body text-on-surface">
            <input type="radio" name="vibe" value="relajado" defaultChecked className="accent-primary-lime" />
            Relajado
          </label>
          <label className="flex items-center gap-2 font-body text-on-surface">
            <input type="radio" name="vibe" value="competitivo" className="accent-primary-lime" />
            Competitivo
          </label>
        </div>
        {state?.errors?.vibe && (
          <p className="mt-1 font-body text-sm text-dark-error">{state.errors.vibe[0]}</p>
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-surface-variant/50 bg-surface-container p-3">
        <legend className={`px-1 ${LABEL_CLASSNAME}`}>
          Pago móvil (opcional)
        </legend>
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
            defaultValue=""
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
        className="w-full rounded-lg bg-primary-lime px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)] disabled:opacity-50"
      >
        {pending ? "Creando..." : "Armar partido"}
      </button>
    </form>
  );
}
