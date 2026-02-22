"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useNotifications, useBatchUpdateNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";

export function NotificationPanel() {
  const open = useUIStore((s) => s.notificationPanelOpen);
  const close = useUIStore((s) => s.closeNotificationPanel);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useNotifications();
  const batchUpdate = useBatchUpdateNotifications();

  const notifications = data?.notifications ?? [];
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

  function handleMarkAllRead() {
    if (unreadIds.length > 0) {
      batchUpdate.mutate({ ids: unreadIds, update: { read: true } });
    }
  }

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    }
    // Delay to prevent the toggle click from immediately closing
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="fixed top-0 right-0 h-full w-80 bg-[var(--bg-primary)] border-l border-[var(--border-primary)] shadow-xl z-40 flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <div className="flex items-center gap-2">
          {unreadIds.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={close}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-sm text-[var(--text-secondary)]">
            Loading...
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3 opacity-30">
              <path
                d="M20 5a12 12 0 00-12 12v6l-3 4h30l-3-4v-6a12 12 0 00-12-12z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M15 31a5 5 0 0010 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-sm">No notifications</p>
            <p className="text-xs mt-1">You&apos;re all caught up!</p>
          </div>
        )}

        {!isLoading &&
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
      </div>
    </div>
  );
}
