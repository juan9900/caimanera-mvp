import { LoginForm } from "./login-form";
import { SiteLogo } from "@/components/site-logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface px-6 py-12 text-on-surface">
      <SiteLogo className="mb-8 h-14 w-auto" priority />
      <h1 className="mb-8 font-display text-2xl font-bold">Iniciar sesión</h1>
      {error === "confirmacion" && (
        <p className="mb-6 max-w-sm text-center font-body text-sm text-dark-error">
          El link de confirmación no es válido o ya expiró. Intenta crear la cuenta de nuevo.
        </p>
      )}
      <LoginForm next={next} />
    </div>
  );
}
