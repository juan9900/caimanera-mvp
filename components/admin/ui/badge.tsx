export type BadgeTone = "green" | "amber" | "red" | "zinc" | "lime";

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  zinc: "bg-zinc-100 text-zinc-600",
  lime: "bg-lime-100 text-lime-800",
};

export function Badge({
  tone = "zinc",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
