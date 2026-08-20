"use client";

import { useState, useTransition } from "react";
import { inviteGroupToMatch } from "@/app/actions/matches";
import type { GroupSummary } from "@/lib/auth/dal";

/** Organizer-only: invite every accepted member of one of their own groups in a single click. */
export function InviteGroup({ matchId, groups }: { matchId: string; groups: GroupSummary[] }) {
  const [isInviting, startInvite] = useTransition();
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (groups.length === 0) return null;

  function invite(groupId: string) {
    setError(null);
    setMessage(null);
    setPendingGroupId(groupId);
    startInvite(async () => {
      const formData = new FormData();
      formData.set("matchId", matchId);
      formData.set("groupId", groupId);
      const result = await inviteGroupToMatch(formData);
      if (result?.message) {
        setError(result.message);
        return;
      }
      setMessage("Invitación enviada a todo el grupo.");
    });
  }

  return (
    <div className="mb-3 flex flex-col gap-2">
      {groups.map(({ group, memberCount }) => (
        <button
          key={group.id}
          type="button"
          disabled={isInviting}
          onClick={() => invite(group.id)}
          className="rounded-lg border border-primary-lime px-4 py-2 text-left font-display text-sm font-bold uppercase tracking-wide text-primary-lime disabled:opacity-50"
        >
          {isInviting && pendingGroupId === group.id
            ? "Invitando…"
            : `Invitar al grupo ${group.name} (${memberCount})`}
        </button>
      ))}
      {error && <p className="font-body text-xs text-dark-error">{error}</p>}
      {message && <p className="font-body text-xs text-primary-lime">{message}</p>}
    </div>
  );
}
