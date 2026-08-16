import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile } from "@/lib/auth/dal";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (profile?.name) redirect("/");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
        Completa tu perfil
      </h1>
      <p className="mb-8 max-w-sm text-center text-zinc-600">
        Esto ayuda a otros jugadores a saber con quién van a jugar.
      </p>
      <OnboardingForm />
    </div>
  );
}
