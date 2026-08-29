"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { searchUsersAction } from "@/app/actions/friends";
import { addCourtManager } from "@/app/actions/billing";
import { Button } from "@/components/admin/ui/button";
import type { UserSearchResult } from "@/lib/auth/dal";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Buscador de usuarios para vincularlos como dueño/manager de una cancha (admin-only).
 * Reutiliza `searchUsersAction` (`app/actions/friends.ts`) — la misma búsqueda por
 * nombre/teléfono que usa el buscador de amigos — porque no hace falta un endpoint
 * nuevo solo para excluir campos de amistad que acá no importan. Debounce de 300ms
 * para no disparar una petición por tecla.
 */
export function CourtManagerSearch({
  courtId,
  linkedUserIds,
}: {
  courtId: string;
  linkedUserIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [linkedNow, setLinkedNow] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isLinking, startLink] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const alreadyLinked = new Set([...linkedUserIds, ...linkedNow]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setError(null);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const found = await searchUsersAction(value);
        setResults(found);
      });
    }, SEARCH_DEBOUNCE_MS);
  }

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function handleLink(userId: string) {
    setError(null);
    startLink(async () => {
      const formData = new FormData();
      formData.set("userId", userId);
      const result = await addCourtManager(courtId, undefined, formData);
      if (result?.message) {
        setError(result.message);
        return;
      }
      setLinkedNow((prev) => new Set(prev).add(userId));
    });
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Buscar por nombre o teléfono..."
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-green-600 focus:outline-none"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {isSearching && <p className="mt-2 text-sm text-zinc-500">Buscando...</p>}

      {!isSearching && query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-2 text-sm text-zinc-500">No encontramos a nadie con ese nombre o teléfono.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {results.map((user) => {
            const linked = alreadyLinked.has(user.id);
            return (
              <li
                key={user.id}
                className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
              >
                <span className="text-sm text-zinc-900">{user.name ?? "Usuario"}</span>
                <Button
                  type="button"
                  variant="primary"
                  disabled={linked || isLinking}
                  onClick={() => handleLink(user.id)}
                  className="px-3 py-1 text-xs"
                >
                  {linked ? "Vinculado" : "Vincular"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
