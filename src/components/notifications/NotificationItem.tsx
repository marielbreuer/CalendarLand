"use client";

import { formatDistanceToNow } from "date-fns";
import { useUpdateNotification } from "@/hooks/useNotifications";
import type { Notification } from "@/types/notification";

interface NotificationItemProps {
  notification: Notification;
}

function typeIcon(type: string) {
  switch (type) {
    case "event_reminder":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-500 flex-shrink-0">
          <path d="M8 2a5 5 0 00-5 5v2.5l-1 1.5h12l-1-1.5V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 12a2 2 0 004 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "task_deadline":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-orange-500 flex-shrink-0">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "daily_briefing":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-purple-500 flex-shrink-0">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 4v4l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const updateNotification = useUpdateNotification();

  function handleDismiss() {
    updateNotification.mutate({ id: notification.id, update: { dismissed: true } });
  }

  function handleMarkRead() {
    if (!notification.read) {
      updateNotification.mutate({ id: notification.id, update: { read: true } });
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.fireAt), { addSuffix: true });

  return (
    <div
      onClick={handleMarkRead}
      className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)] ${
        !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
      }`}
    >
      <div className="mt-0.5">{typeIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${!notification.read ? "font-semibold" : ""}`}>
          {notification.title}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
          {timeAgo}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex-shrink-0"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
