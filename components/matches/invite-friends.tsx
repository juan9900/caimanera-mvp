"use client";

import { useState, useTransition } from "react";
import { inviteToMatch } from "@/app/actions/matches";
import { searchUsersAction } from "@/app/actions/friends";
import type { Friend, UserSearchResult } from "@/lib/auth/dal";

/**
 * Organizer-only picker for private matches: invite every friend in one tap,
 * or hand-pick specific people from the friends list plus a search bar.
 * There's no "request to join" for private matches anymore — this is the
 * only way in (see `inviteToMatch`).
 */
export function InviteFriends({
  matchId,
  friends,
  excludedUserIds,
}: {
  matchId: string;
  friends: Friend[];
  excludedUserIds: string[];
}) {
  const excluded = new Set(excludedUserIds);
  const invitableFriends = friends.filter((f) => !excluded.has(f.user.id));

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isInviting, startInvite] = useTransition();

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
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={isInviting || invitableFriends.length === 0}
        onClick={() => invite(invitableFriends.map((f) => f.user.id))}
        className="rounded-lg bg-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-on-primary  disabled:opacity-50"
      >
        Invitar a todos mis amigos
      </button>

      <div className="rounded-xl border border-surface-variant/50 bg-surface-container p-3">
        <p className="mb-2 font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
          O elige jugadores específicos
        </p>

        {invitableFriends.length > 0 && (
          <ul className="mb-3 flex flex-col gap-1">
            {invitableFriends.map((friend) => (
              <li key={friend.user.id}>
                <button
                  type="button"
                  onClick={() => toggle(friend.user.id)}
                  aria-pressed={selected.has(friend.user.id)}
                  className="flex w-full items-center gap-2 py-1 text-left font-body text-sm text-on-surface"
                >
                  <span
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                      selected.has(friend.user.id)
                        ? "border-primary-lime bg-primary-lime"
                        : "border-outline-variant bg-transparent"
                    }`}
                  />
                  {friend.user.name ?? "Jugador"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant"
        />
        {isSearching && (
          <p className="mt-2 font-body text-xs text-on-surface-variant">
            Buscando...
          </p>
        )}
        {results.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => toggle(user.id)}
                  aria-pressed={selected.has(user.id)}
                  className="flex w-full items-center gap-2 py-1 text-left font-body text-sm text-on-surface"
                >
                  <span
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                      selected.has(user.id)
                        ? "border-primary-lime bg-primary-lime"
                        : "border-outline-variant bg-transparent"
                    }`}
                  />
                  {user.name ?? "Jugador"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected.size > 0 && (
          <button
            type="button"
            disabled={isInviting}
            onClick={() => invite(Array.from(selected))}
            className="mt-3 rounded-lg border border-primary-lime px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-primary-lime disabled:opacity-50"
          >
            Invitar seleccionados ({selected.size})
          </button>
        )}
      </div>

      {error && <p className="font-body text-xs text-dark-error">{error}</p>}
      {message && (
        <p className="font-body text-xs text-primary-lime">{message}</p>
      )}
    </div>
  );
}
