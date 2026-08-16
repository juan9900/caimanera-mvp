import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
        Crear cuenta
      </h1>
      <p className="mb-8 max-w-sm text-center text-zinc-600">
        Necesitás un código de invitación de alguien de la red para unirte.
      </p>
      <SignupForm defaultInviteCode={ref} />
    </div>
  );
}
