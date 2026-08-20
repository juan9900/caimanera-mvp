"use client";

import { useEffect, useRef, useState } from "react";

export function CopyInviteLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.textContent = `${window.location.origin}${path}`;
    }
  }, [path]);

  async function handleCopy() {
    const link = linkRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    const link = linkRef.current?.textContent ?? `${window.location.origin}${path}`;
    if (navigator.share) {
      navigator.share({ url: link }).catch(() => {});
      return;
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(link)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-surface-variant/50 bg-surface-container px-4 py-3">
      <span ref={linkRef} className="flex-1 truncate font-label text-sm text-on-surface">
        {path}
      </span>
      <button
        type="button"
        onClick={handleShare}
        className="shrink-0 rounded-lg border border-outline-variant px-3 py-1.5 font-label text-xs font-bold text-on-surface"
      >
        Compartir
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-lg bg-primary-lime px-3 py-1.5 font-label text-xs font-bold text-on-primary"
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
