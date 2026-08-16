"use client";

import { useEffect, useRef, useState } from "react";

export function CopyInviteLink({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.textContent = `${window.location.origin}/signup?ref=${referralCode}`;
    }
  }, [referralCode]);

  async function handleCopy() {
    const link = linkRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-3">
      <span ref={linkRef} className="flex-1 truncate font-mono text-sm text-zinc-900">
        {`/signup?ref=${referralCode}`}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
