"use client";

import { useState, useTransition } from "react";
import { createInvitation } from "@/app/actions/invitations";

export function GenerateInvitationButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await createInvitation();
      setError(result?.message ?? null);
    });
  }

  return (
    <div>
      <button
        disabled={pending}
        onClick={handleClick}
        className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "Generando..." : "Generar invitación"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
