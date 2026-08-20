"use client";

import { useState, useTransition } from "react";
import { renameGroup } from "@/app/actions/groups";

export function RenameGroupForm({ groupId, name }: { groupId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-bold">{name}</h1>
        <button
          type="button"
          onClick={() => {
            setValue(name);
            setEditing(true);
          }}
          className="font-label text-xs font-bold text-primary-lime"
        >
          Renombrar
        </button>
      </div>
    );
  }

  return (
    <form
      action={() => {
        setError(null);
        startTransition(async () => {
          const formData = new FormData();
          formData.set("groupId", groupId);
          formData.set("name", value);
          const result = await renameGroup(formData);
          if (result?.message) {
            setError(result.message);
            return;
          }
          setEditing(false);
        });
      }}
      className="flex items-center gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-surface-variant bg-surface-container px-3 py-1.5 font-display text-lg font-bold text-on-surface focus:border-primary-lime focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary disabled:opacity-50"
      >
        {isPending ? "Guardando…" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="font-label text-xs font-bold text-on-surface-variant"
      >
        Cancelar
      </button>
      {error && <p className="font-body text-xs text-dark-error">{error}</p>}
    </form>
  );
}
