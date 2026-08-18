import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile } from "@/lib/auth/dal";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (profile?.name) redirect("/");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface px-6 py-12 text-on-surface">
      <h1 className="mb-2 font-display text-2xl font-bold">Completa tu perfil</h1>
      <p className="mb-8 max-w-sm text-center font-body text-on-surface-variant">
        Esto ayuda a otros jugadores a saber con quién van a jugar.
      </p>
      <OnboardingForm />
    </div>
  );
}
