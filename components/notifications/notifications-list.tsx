"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  CheckCircle2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import type { Notification } from "@/lib/auth/dal";
import { markAllNotificationsRead } from "@/app/actions/notifications";

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  join_request: UserPlus,
  request_approved: CheckCircle2,
  match_joined: UserPlus,
  invited_match: Calendar,
  match_cancelled: XCircle,
  match_reopened: Calendar,
  match_updated: Calendar,
  group_invited: Users,
  group_joined: Users,
  friend_request: UserPlus,
  friend_accepted: CheckCircle2,
};

/** Coarse "hace X" relative time — this list never needs second-level precision. */
function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(isoDate).toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}

function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const unread = !notification.read_at;

  const content = (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
        unread
          ? "border-primary-lime/40 bg-primary-lime/10"
          : "border-surface-variant/50 bg-surface-container"
      }`}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          unread ? "bg-primary-lime text-on-primary" : "bg-surface-variant text-on-surface-variant"
        }`}
      >
        <Icon aria-hidden size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-body font-semibold text-on-surface">{notification.title}</p>
        <p className="font-body text-sm text-on-surface-variant">{notification.body}</p>
        <p className="mt-1 font-label text-xs text-on-surface-variant/70">
          {timeAgo(notification.created_at)}
        </p>
      </div>
      {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-lime" />}
    </div>
  );

  if (!notification.url) return content;

  return (
    <Link href={notification.url} className="block active:scale-[0.99]">
      {content}
    </Link>
  );
}

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  // Opening this page is the "I've seen this" signal — mark everything read
  // once, on mount, so the header bell badge clears without a separate action.
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  if (notifications.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-surface-variant px-4 py-8 text-center font-body text-on-surface-variant">
        Todavía no tienes notificaciones.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <NotificationItem notification={notification} />
        </li>
      ))}
    </ul>
  );
}
