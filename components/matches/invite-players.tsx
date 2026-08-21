"use client";

import { useMemo, useState, useTransition } from "react";
import { inviteToMatch, inviteGroupToMatch } from "@/app/actions/matches";
import { searchUsersAction } from "@/app/actions/friends";
import type { Friend, GroupSummary, UserSearchResult } from "@/lib/auth/dal";

/**
 * Organizer-only picker for private matches: both groups and friends are
 * collapsible sections (invite one group at a time, or search/pick from
 * friends) instead of stacking every group's button plus a flat friend list —
 * this keeps the panel usable for organizers with many friends/groups.
 * There's no "request to join" for private matches anymore — this is the
 * only way in (see `inviteToMatch` / `inviteGroupToMatch`).
 */
export function InvitePlayers({
  matchId,
  friends,
  groups,
  excludedUserIds,
}: {
  matchId: string;
  friends: Friend[];
  groups: GroupSummary[];
  excludedUserIds: string[];
}) {
  const excluded = new Set(excludedUserIds);
  const invitableFriends = useMemo(
    () => friends.filter((f) => !excluded.has(f.user.id)),
    [friends, excludedUserIds]
  );

  return (
    <div className="flex flex-col gap-4">
      {groups.length > 0 && <GroupInviteSection matchId={matchId} groups={groups} />}
      <FriendInviteSection
        matchId={matchId}
        invitableFriends={invitableFriends}
        excluded={excluded}
      />
    </div>
  );
}

function GroupInviteSection({
  matchId,
  groups,
}: {
  matchId: string;
  groups: GroupSummary[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInviting, startInvite] = useTransition();
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    <div className="rounded-xl border border-surface-variant/50 bg-surface-container p-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between font-label text-sm font-bold uppercase tracking-wide text-on-surface"
      >
        <span>Invitar a un grupo ({groups.length})</span>
        <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && (
        <ul className="mt-3 flex flex-col gap-2">
          {groups.map(({ group, memberCount }) => (
            <li
              key={group.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-surface-variant/50 bg-surface px-3 py-2"
            >
              <span className="font-body text-sm text-on-surface">
                {group.name} ({memberCount})
              </span>
              <button
                type="button"
                disabled={isInviting}
                onClick={() => invite(group.id)}
                className="shrink-0 rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary active:scale-95 disabled:opacity-50"
              >
                {isInviting && pendingGroupId === group.id ? "Invitando…" : "Invitar"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 font-body text-xs text-dark-error">{error}</p>}
      {message && <p className="mt-2 font-body text-xs text-primary-lime">{message}</p>}
    </div>
  );
}

function FriendInviteSection({
  matchId,
  invitableFriends,
  excluded,
}: {
  matchId: string;
  invitableFriends: Friend[];
  excluded: Set<string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isInviting, startInvite] = useTransition();

  const filteredFriends = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return invitableFriends;
    return invitableFriends.filter((f) => (f.user.name ?? "").toLowerCase().includes(trimmed));
  }, [invitableFriends, query]);

  const friendIds = useMemo(() => new Set(invitableFriends.map((f) => f.user.id)), [invitableFriends]);
  const otherResults = useMemo(
    () => results.filter((u) => !friendIds.has(u.id)),
    [results, friendIds]
  );

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      const found = await searchUsersAction(value);
      setResults(found.filter((u) => !excluded.has(u.id)));
    });
  }

  function invite(userIds: string[]) {
    setError(null);
    setMessage(null);
    if (userIds.length === 0) return;
    startInvite(async () => {
      const formData = new FormData();
      formData.set("matchId", matchId);
      formData.set("userIds", userIds.join(","));
      const result = await inviteToMatch(formData);
      if (result?.message) {
        setError(result.message);
        return;
      }
      setMessage("Invitación enviada.");
      setSelected(new Set());
      setResults([]);
      setQuery("");
    });
  }

  return (
    <div className="rounded-xl border border-surface-variant/50 bg-surface-container p-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between font-label text-sm font-bold uppercase tracking-wide text-on-surface"
      >
        <span>Invitar amigos ({invitableFriends.length})</span>
        <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && (
        <div className="mt-3">
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Buscar amigo o jugador..."
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant"
          />

          {filteredFriends.length > 0 ? (
            <ul className="mt-3 flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
              {filteredFriends.map((friend) => (
                <FriendRow
                  key={friend.user.id}
                  id={friend.user.id}
                  name={friend.user.name}
                  selected={selected.has(friend.user.id)}
                  onToggle={toggle}
                />
              ))}
            </ul>
          ) : (
            query.trim().length > 0 && (
              <p className="mt-3 font-body text-xs text-on-surface-variant">
                Ningún amigo coincide con “{query}”.
              </p>
            )
          )}

          {isSearching && (
            <p className="mt-2 font-body text-xs text-on-surface-variant">Buscando...</p>
          )}
          {otherResults.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 border-t border-surface-variant/50 pt-2">
              {otherResults.map((user) => (
                <FriendRow
                  key={user.id}
                  id={user.id}
                  name={user.name}
                  selected={selected.has(user.id)}
                  onToggle={toggle}
                />
              ))}
            </ul>
          )}

          {selected.size > 0 && (
            <button
              type="button"
              disabled={isInviting}
              onClick={() => invite(Array.from(selected))}
              className="mt-3 w-full rounded-lg border border-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-primary-lime disabled:opacity-50"
            >
              Invitar seleccionados ({selected.size})
            </button>
          )}

          <button
            type="button"
            disabled={isInviting || invitableFriends.length === 0}
            onClick={() => invite(invitableFriends.map((f) => f.user.id))}
            className="mt-2 w-full rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary disabled:opacity-50"
          >
            Invitar a todos mis amigos
          </button>
        </div>
      )}

      {error && <p className="mt-2 font-body text-xs text-dark-error">{error}</p>}
      {message && <p className="mt-2 font-body text-xs text-primary-lime">{message}</p>}
    </div>
  );
}

function FriendRow({
  id,
  name,
  selected,
  onToggle,
}: {
  id: string;
  name: string | null;
  selected: boolean;
  onToggle: (userId: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-pressed={selected}
        className="flex w-full items-center gap-2 py-1 text-left font-body text-sm text-on-surface"
      >
        <span
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
            selected ? "border-primary-lime bg-primary-lime" : "border-outline-variant bg-transparent"
          }`}
        />
        {name ?? "Jugador"}
      </button>
    </li>
  );
}
