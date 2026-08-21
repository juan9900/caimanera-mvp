"use client";

import { useState, useTransition } from "react";
import { sendFriendRequest } from "@/app/actions/friends";

/** Small "Agregar" button that sends a friend request and shows an optimistic sent state. */
export function AddFriendButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("addresseeId", userId);
      const result = await sendFriendRequest(formData);
      if (result?.message) {
        setError(result.message);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <span className="font-label text-xs font-bold text-on-surface-variant">
        Solicitud enviada
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-lg border border-primary-lime px-3 py-1.5 font-label text-xs font-bold text-primary-lime active:scale-95 disabled:opacity-50"
      >
        Agregar
      </button>
      {error && <p className="font-body text-xs text-dark-error">{error}</p>}
    </div>
  );
}
