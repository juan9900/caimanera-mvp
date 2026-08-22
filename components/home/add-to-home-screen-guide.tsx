"use client";

import { useSyncExternalStore } from "react";
import { isStandalone } from "@/lib/push/subscribe-client";

const noopSubscribe = () => () => {};

function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function AddToHomeScreenGuide() {
  const isClient = useIsClient();
  const installed = isClient && isStandalone();

  if (!isClient || installed) return null;

  return (
    <section className="px-4">
      <div className="rounded-2xl border border-surface-variant/50 bg-surface-container p-5">
        <h3 className="font-display text-base font-bold text-on-surface">
          Acceso rápido
        </h3>
        <p className="mt-1.5 font-body text-xs text-on-surface-variant">
          Agrega Kancha a tu pantalla de inicio para entrar con un toque, como una app.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              iPhone (Safari)
            </p>
            <ol className="mt-2 space-y-1 font-body text-xs text-on-surface-variant">
              <li>1. Toca <span className="inline-block">Compartir ⬆️</span> en la barra inferior.</li>
              <li>2. Desplázate y elige <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.</li>
              <li>3. Toca <strong>&quot;Añadir&quot;</strong>. ¡Listo!</li>
            </ol>
          </div>

          <div>
            <p className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Android (Chrome)
            </p>
            <ol className="mt-2 space-y-1 font-body text-xs text-on-surface-variant">
              <li>1. Abre el menú <span className="inline-block">⋮</span> (arriba a la derecha).</li>
              <li>2. Elige <strong>&quot;Añadir a pantalla de inicio&quot;</strong> o <strong>&quot;Instalar app&quot;</strong>.</li>
              <li>3. Confirma. ¡Listo!</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
