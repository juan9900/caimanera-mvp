import { RestablecerForm } from "./restablecer-form";
import { SiteLogo } from "@/components/site-logo";

export default function RestablecerPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface px-6 py-12 text-on-surface">
      <SiteLogo className="mb-8 h-14 w-auto" priority />
      <h1 className="mb-8 font-display text-2xl font-bold">Nueva contraseña</h1>
      <RestablecerForm />
    </div>
  );
}
