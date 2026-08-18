import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface px-6 py-12 text-center text-on-surface">
      <h1 className="font-display text-xl font-bold">No encontramos esta página</h1>
      <p className="font-body text-sm text-on-surface-variant">
        Puede que el link esté roto o el contenido ya no exista.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)]"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
