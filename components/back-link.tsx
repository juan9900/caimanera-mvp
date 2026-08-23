"use client";

import { useRouter } from "next/navigation";

/**
 * Back button that returns to wherever the user actually came from
 * (browser history) instead of a hardcoded route. Falls back to `fallbackHref`
 * when there's no in-app history to go back to (e.g. the page was opened
 * directly, such as from a shared link or a new tab).
 */
export function BackLink({
  fallbackHref,
  className,
  children,
}: {
  fallbackHref: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
