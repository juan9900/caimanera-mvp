"use client";

import { useState, useTransition } from "react";
import { searchUsersForGroupAction, inviteToGroup } from "@/app/actions/groups";
import type { GroupUserSearchResult, NetworkUser } from "@/lib/auth/dal";
import type { GroupRelation } from "@/lib/groups/definitions";

const RELATION_LABEL: Record<GroupUserSearchResult["groupRelation"], string> = {
  ninguna: "Invitar",
  invitado: "Invitación enviada",
  miembro: "Ya es miembro",
};

type FriendOption = { user: NetworkUser; groupRelation: GroupRelation };

export function GroupUserSearch({
  groupId,
  friends = [],
}: {
  groupId: string;
  friends?: FriendOption[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupUserSearchResult[]>([]);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isSending, startSend] = useTransition();

  function handleQueryChange(value: string) {
    setQuery(value);
    setError(null);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      const found = await searchUsersForGroupAction(groupId, value);
      setResults(found);
    });
  }

  function handleInvite(userId: string) {
    setError(null);
    startSend(async () => {
      const formData = new FormData();
      formData.set("groupId", groupId);
      formData.set("userIds", userId);
      const result = await inviteToGroup(formData);
      if (result?.message) {
        setError(result.message);
        return;
      }
      setSentTo((prev) => new Set(prev).add(userId));
    });
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Buscar por nombre o teléfono..."
        className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2 font-body text-on-surface placeholder:text-on-surface-variant"
      />
      {error && <p className="mt-1 font-body text-xs text-dark-error">{error}</p>}

      {isSearching && (
        <p className="mt-3 font-body text-sm text-on-surface-variant">Buscando...</p>
      )}

      {!isSearching && query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-3 font-body text-sm text-on-surface-variant">
          No encontramos a nadie con ese nombre o teléfono.
        </p>
      )}

      {query.trim().length >= 2 && results.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {results.map((user) => (
            <InviteRow
              key={user.id}
              id={user.id}
              name={user.name}
              zone={user.zone}
              relation={sentTo.has(user.id) ? "invitado" : user.groupRelation}
              disabled={isSending}
              onInvite={handleInvite}
            />
          ))}
        </ul>
      )}

      {query.trim().length < 2 && friends.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Tus amigos
          </p>
          <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
            {friends.map(({ user, groupRelation }) => (
              <InviteRow
                key={user.id}
                id={user.id}
                name={user.name}
                zone={user.zone}
                relation={sentTo.has(user.id) ? "invitado" : groupRelation}
                disabled={isSending}
                onInvite={handleInvite}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InviteRow({
  id,
  name,
  zone,
  relation,
  disabled,
  onInvite,
}: {
  id: string;
  name: string | null;
  zone: string | null;
  relation: GroupUserSearchResult["groupRelation"];
  disabled: boolean;
  onInvite: (userId: string) => void;
}) {
  const canInvite = relation === "ninguna";
  return (
    <li className="flex items-center justify-between rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3">
      <div>
        <p className="font-body text-on-surface">{name ?? "Jugador"}</p>
        {zone && <p className="font-body text-sm text-on-surface-variant">{zone}</p>}
      </div>
      <button
        type="button"
        disabled={!canInvite || disabled}
        onClick={() => onInvite(id)}
        className="shrink-0 rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary active:scale-95 disabled:opacity-50"
      >
        {RELATION_LABEL[relation]}
      </button>
    </li>
  );
}
