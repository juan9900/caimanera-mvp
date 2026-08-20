export type CourtHours = {
  opens_at: string | null;
  closes_at: string | null;
  open_days: number[];
};

/** Weekday checkboxes for the admin form, ordered Mon–Sun but valued per JS `Date.getDay()` (0=Sunday). */
export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
] as const;

/** Formats a Postgres `time` string ("HH:MM:SS") as 12-hour clock, e.g. "7:00 AM". */
function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  const hour = Number(hStr);
  const minute = Number(mStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

/**
 * Formats a court's opening hours for "today" (per `now`), e.g. "7:00 AM – 11:30 PM".
 * Returns a closed/unknown message when the court doesn't operate today or hasn't
 * set structured hours yet.
 */
export function formatTodayHours(court: CourtHours, now: Date = new Date()): string {
  if (!court.opens_at || !court.closes_at) return "Horario no disponible";
  if (!court.open_days.includes(now.getDay())) return "Cerrado hoy";
  return `${formatTime12h(court.opens_at)} – ${formatTime12h(court.closes_at)}`;
}
