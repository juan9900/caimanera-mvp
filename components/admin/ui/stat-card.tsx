import Link from "next/link";
import type { LucideIcon } from "lucide-react";

function StatCardContent({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-2xl font-semibold text-zinc-900">{value}</p>
        {Icon && <Icon aria-hidden size={18} className="text-zinc-400" />}
      </div>
      <p className="text-sm text-zinc-500">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

/** Small metric tile for dashboard grids. Wraps in a `Link` when `href` is given. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className="block transition hover:border-zinc-300 hover:shadow">
        <StatCardContent label={label} value={value} hint={hint} icon={icon} />
      </Link>
    );
  }
  return <StatCardContent label={label} value={value} hint={hint} icon={icon} />;
}
