"use client";

import { useEffect, useReducer, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { completeOnboardingTour } from "@/app/actions/profile";

const STORAGE_KEY = "caimanera_onboarding_tour_seen";

const noopSubscribe = () => () => {};

/** True once mounted on the client — avoids a hydration mismatch vs. the server render. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Whether the tour was already dismissed on this device, per `localStorage`. */
function useTourSeen(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => localStorage.getItem(STORAGE_KEY) === "1",
    () => false,
  );
}

type TourStep = {
  /** `data-tour` value of the target element, or `null` for a centered card with no spotlight. */
  target: string | null;
  title: string;
  body: string;
};

const STEPS: TourStep[] = [
  {
    target: null,
    title: "¡Bienvenido a Caimanera! \u{1F44B}",
    body: "Te muestro lo esencial en 20 segundos.",
  },
  {
    target: "crear",
    title: "Arma tu partido",
    body: "Elige deporte, cancha, día y cupos, y decide si es pública, solo para amigos o privada.",
  },
  {
    target: "partidos",
    title: "Explora y únete",
    body: "Mira partidos abiertos cerca de ti y pide unirte. Aquí también ves los tuyos.",
  },
  {
    target: "canchas",
    title: "Encuentra cancha",
    body: "El mapa de canchas: dónde jugar, con horarios y calificaciones.",
  },
  {
    target: "invitaciones",
    title: "Tus invitaciones",
    body: "Cuando te inviten a un partido o grupo, te llega aquí. El número indica cuántas tienes.",
  },
  {
    target: "social",
    title: "Amigos",
    body: "Agrega amigos y crea grupos para invitarlos a tus partidos de un toque.",
  },
  {
    target: null,
    title: "Guárdala en tu pantalla de inicio",
    body: "Agrega Caimanera a la pantalla de inicio de tu teléfono para entrar con un toque, como una app. Si necesitas ayuda, al final del inicio tienes una guía paso a paso.",
  },
  {
    target: null,
    title: "¡Listo para jugar! \u{26BD}",
    body: "Activa las notificaciones desde tu Perfil para enterarte cuando falten jugadores.",
  },
];

/** Highlighted rect around the current step's target, re-measured on resize/layout changes. */
function useTargetRect(target: string | null, active: boolean): DOMRect | null {
  const [tick, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!active || !target) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) return;

    const observer = new ResizeObserver(bump);
    observer.observe(el);
    window.addEventListener("resize", bump);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", bump);
    };
  }, [target, active]);

  if (!active || !target) return null;
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  // `tick` is read only to force a re-measure on resize/layout changes.
  void tick;
  return el ? el.getBoundingClientRect() : null;
}

/**
 * First-run guided tour: spotlights real nav elements (tagged with
 * `data-tour`) with a step-by-step tooltip. Runs once per user, tracked by
 * `users.onboarding_tour_completed` (mirrored to localStorage to avoid a
 * flash on repeat visits before the server value is available).
 */
export function OnboardingTour({ run }: { run: boolean }) {
  const isClient = useIsClient();
  const alreadySeen = useTourSeen();
  const [dismissed, setDismissed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const active = isClient && run && !alreadySeen && !dismissed;

  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  const step = STEPS[stepIndex];
  const rect = useTargetRect(step?.target ?? null, active);

  if (!active || !step) return null;

  function finish() {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "1");
    void completeOnboardingTour();
  }

  function next() {
    if (stepIndex === STEPS.length - 1) {
      finish();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  const padding = 8;
  const spotlightStyle = rect
    ? {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    : null;

  const tooltipOnTop = rect ? rect.top > window.innerHeight / 2 : false;

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      {spotlightStyle ? (
        <div
          className="absolute rounded-2xl transition-all duration-300"
          style={{
            ...spotlightStyle,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      <div
        className={`absolute left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-outline-variant/50 bg-surface-container p-5 shadow-xl ${
          !spotlightStyle ? "top-1/2 -translate-y-1/2" : ""
        }`}
        style={
          spotlightStyle
            ? tooltipOnTop
              ? { bottom: window.innerHeight - spotlightStyle.top + 12 }
              : { top: spotlightStyle.top + spotlightStyle.height + 12 }
            : undefined
        }
      >
        <h2 className="font-display text-lg font-bold text-on-surface">{step.title}</h2>
        <p className="mt-1.5 font-body text-sm text-on-surface-variant">{step.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === stepIndex ? "bg-primary-lime" : "bg-outline-variant"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={back}
                className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant"
              >
                Atrás
              </button>
            )}
            {stepIndex < STEPS.length - 1 && (
              <button
                type="button"
                onClick={finish}
                className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant"
              >
                Saltar
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-primary-lime px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-on-primary"
            >
              {stepIndex === STEPS.length - 1 ? "Finalizar" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
