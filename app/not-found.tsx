import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">No encontramos esta página</h1>
      <p className="text-sm text-zinc-500">
        Puede que el link esté roto o el contenido ya no exista.
      </p>
      <Link
        href="/"
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
