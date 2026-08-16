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
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
    >
      Compartir
    </button>
  );
}
