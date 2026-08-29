import Image from "next/image";

const LOGO_URL =
  "https://res.cloudinary.com/do8t1qxve/image/upload/v1787612162/Kancha/Logo_kancha_definitivo_ygg9ek_cxtk1f.webp";

/** App wordmark. Uses `unoptimized` for the remote Cloudinary URL (same pattern as `components/courts/court-hero.tsx`), so no `next.config.ts` remotePatterns entry is needed. */
export function SiteLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={LOGO_URL}
      alt="Kancha"
      width={140}
      height={40}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}
