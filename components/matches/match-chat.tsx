"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMatchMessage } from "@/app/actions/chat";
import type { ChatMessage } from "@/lib/auth/dal";
import type { Tables } from "@/lib/supabase/database.types";

type RawMessage = Tables<"chat_messages">;

/**
 * Chat de un partido, visible solo al organizador y a los confirmados (la
 * RLS de `chat_messages` ya lo exige). A diferencia del patrón de
 * `home-client.tsx` (realtime → `router.refresh()`), esto agrega
 * `payload.new` directo al estado local para que los mensajes aparezcan sin
 * volver a pedir la página entera.
 */
export function MatchChat({
  matchId,
  currentUserId,
  initialMessages,
  participantNames,
}: {
  matchId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  /** `userId -> nombre`, para nombrar mensajes nuevos que llegan sin el join. */
  participantNames: Record<string, string | null>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  // `participantNames` is a fresh object on every server render of the parent
  // page (e.g. after `revalidatePath` on every message sent) — kept in a ref,
  // not a subscribe-effect dependency, so sending a message doesn't tear down
  // and resubscribe the realtime channel and risk missing the broadcast for
  // the very message that triggered the resubscribe.
  const participantNamesRef = useRef(participantNames);
  useEffect(() => {
    participantNamesRef.current = participantNames;
  }, [participantNames]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`match-chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as RawMessage;
          setMessages((current) => {
            if (current.some((m) => m.id === row.id)) return current;
            return [
              ...current,
              { ...row, author: { id: row.user_id, name: participantNamesRef.current[row.user_id] ?? null } },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const formatTime = useMemo(
    () => (iso: string) =>
      new Date(iso).toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit" }),
    [],
  );

  return (
    <div className="flex flex-col rounded-xl border border-surface-variant/50 bg-surface-container">
      <div ref={listRef} className="flex max-h-80 flex-col gap-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-4 text-center font-body text-sm text-on-surface-variant">
            Todavía no hay mensajes. Escribe el primero.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === currentUserId;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <span className="font-label text-[10px] font-bold text-on-surface-variant">
                  {mine ? "Tú" : (m.author?.name ?? "Jugador")} · {formatTime(m.created_at)}
                </span>
                <p
                  className={`mt-0.5 max-w-[85%] rounded-xl px-3 py-1.5 font-body text-sm ${
                    mine
                      ? "bg-primary-lime text-on-primary"
                      : "bg-surface text-on-surface"
                  }`}
                >
                  {m.body}
                </p>
              </div>
            );
          })
        )}
      </div>

      <form
        action={() => {
          if (body.trim().length === 0) return;
          setError(null);
          const text = body;
          setBody("");
          startTransition(async () => {
            const formData = new FormData();
            formData.set("matchId", matchId);
            formData.set("body", text);
            const result = await sendMatchMessage(formData);
            if (result?.message) setError(result.message);
          });
        }}
        className="flex items-center gap-2 border-t border-surface-variant/50 px-4 py-3"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe un mensaje…"
          maxLength={1000}
          className="min-w-0 flex-1 rounded-lg border border-surface-variant bg-surface px-3 py-1.5 font-body text-sm text-on-surface focus:border-primary-lime focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || body.trim().length === 0}
          className="rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
      {error && <p className="px-4 pb-3 font-body text-xs text-dark-error">{error}</p>}
    </div>
  );
}
