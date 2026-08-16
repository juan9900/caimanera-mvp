import { redirect } from "next/navigation";
import { verifySession, getCurrentUserProfile, getOwnInvitations } from "@/lib/auth/dal";
import { GenerateInvitationButton } from "./generate-invitation-button";

export default async function InvitationsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const invitations = await getOwnInvitations();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Tus invitaciones
        </h1>
        <p className="mb-6 text-zinc-600">
          Comparte un código con alguien de confianza para sumarlo a tu red.
        </p>

        <GenerateInvitationButton />

        <ul className="mt-8 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {invitations.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              Todavía no generaste ninguna invitación.
            </li>
          )}
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="font-mono text-zinc-900">{invitation.code}</span>
              <span className="text-sm text-zinc-500">
                {invitation.used_at ? "Usada" : "Disponible"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
