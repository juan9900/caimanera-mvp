import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySession, getCurrentUserProfile, getGroupPreviewByToken } from "@/lib/auth/dal";
import { joinGroupByToken } from "@/app/actions/groups";
import { MatchActionForm } from "@/components/match-action-form";

export default async function JoinGroupPage(props: PageProps<"/grupos/unirse/[token]">) {
  const { token } = await props.params;

  const session = await verifySession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/grupos/unirse/${token}`)}`);

  const profile = await getCurrentUserProfile();
  if (!profile?.name) redirect("/onboarding");

  const preview = await getGroupPreviewByToken(token);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface px-6 py-12 text-on-surface">
      {preview ? (
        <>
          <h1 className="mb-2 text-center font-display text-2xl font-bold">{preview.name}</h1>
          <p className="mb-8 text-center font-body text-on-surface-variant">
            {preview.ownerName ?? "Alguien"} te invitó a este grupo · {preview.memberCount}{" "}
            {preview.memberCount === 1 ? "miembro" : "miembros"}
          </p>
          <MatchActionForm
            action={joinGroupByToken}
            hiddenFields={{ token }}
            label="Unirme al grupo"
            pendingLabel="Uniéndome…"
            className="rounded-lg bg-primary-lime px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-primary shadow-[0_4px_12px_rgba(195,244,0,0.2)]"
          />
        </>
      ) : (
        <>
          <h1 className="mb-2 text-center font-display text-2xl font-bold">
            Este link ya no es válido
          </h1>
          <p className="mb-8 text-center font-body text-on-surface-variant">
            Pídele uno nuevo a quien te invitó.
          </p>
          <Link
            href="/grupos"
            className="rounded-lg border border-outline-variant px-4 py-2 font-label text-xs font-bold text-on-surface"
          >
            Ir a mis grupos
          </Link>
        </>
      )}
    </div>
  );
}
