import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface px-6 py-12 text-on-surface">
      <h1 className="mb-2 font-display text-2xl font-bold">Crear cuenta</h1>
      <p className="mb-8 max-w-sm text-center font-body text-on-surface-variant">
        Necesitás un código de invitación de alguien de la red para unirte.
      </p>
      <SignupForm defaultInviteCode={ref} />
    </div>
  );
}
