"use client";

type ShareMatchButtonProps = {
  title: string;
  datetime: string;
};

export function ShareMatchButton({ title, datetime }: ShareMatchButtonProps) {
  const handleShare = () => {
    const when = new Date(datetime).toLocaleString("es-VE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const text = `${title}, ${when}. Sumate acá: ${window.location.href}`;

    if (navigator.share) {
      navigator.share({ title, text, url: window.location.href }).catch(() => {});
      return;
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-lg border border-surface-variant px-3 py-1.5 font-label text-xs font-bold text-on-surface"
    >
      Compartir
    </button>
  );
}
