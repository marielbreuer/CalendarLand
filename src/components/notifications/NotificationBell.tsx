"use client";

import { useUnreadCount } from "@/hooks/useNotifications";
import { useUIStore } from "@/stores/uiStore";

export function NotificationBell() {
  const toggleNotificationPanel = useUIStore((s) => s.toggleNotificationPanel);
  const notificationPanelOpen = useUIStore((s) => s.notificationPanelOpen);
  const { data } = useUnreadCount();

  const count = data?.notifications?.length ?? 0;

  return (
    <button
      onClick={toggleNotificationPanel}
      className={`relative p-1.5 rounded-lg transition-colors ${
        notificationPanelOpen
          ? "bg-white shadow-sm text-[var(--pink-deep)]"
          : "text-[var(--text-secondary)] hover:bg-white/50"
      }`}
      aria-label="Notifications"
      title="Notifications (R)"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 2a5 5 0 00-5 5v3l-1.5 2h13L14 10V7a5 5 0 00-5-5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 14.5a2 2 0 004 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
