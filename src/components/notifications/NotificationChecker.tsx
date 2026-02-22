"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  useDueNotifications,
  useUpdateNotification,
  useSyncNotifications,
} from "@/hooks/useNotifications";

const BRIEFING_KEY = "calendar_land_last_briefing";
const TASK_SYNC_KEY = "calendar_land_last_task_sync";
const SIX_HOURS = 6 * 60 * 60 * 1000;

export function NotificationChecker() {
  const { data } = useDueNotifications();
  const updateNotification = useUpdateNotification();
  const syncNotifications = useSyncNotifications();
  const firedRef = useRef<Set<string>>(new Set());

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Daily briefing sync on first load each day
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastBriefing = localStorage.getItem(BRIEFING_KEY);
    if (lastBriefing !== today) {
      syncNotifications.mutate(
        { type: "daily_briefing" },
        {
          onSuccess: () => {
            localStorage.setItem(BRIEFING_KEY, today);
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic task deadline sync
  useEffect(() => {
    function syncTasks() {
      const lastSync = localStorage.getItem(TASK_SYNC_KEY);
      const now = Date.now();
      if (!lastSync || now - parseInt(lastSync, 10) > SIX_HOURS) {
        syncNotifications.mutate(
          { type: "tasks" },
          {
            onSuccess: () => {
              localStorage.setItem(TASK_SYNC_KEY, now.toString());
            },
          }
        );
      }
    }
    syncTasks();
    const interval = setInterval(syncTasks, SIX_HOURS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire due notifications
  useEffect(() => {
    if (!data?.notifications?.length) return;

    for (const n of data.notifications) {
      if (firedRef.current.has(n.id)) continue;
      firedRef.current.add(n.id);

      // Show sonner toast
      toast(n.title, { description: n.body, duration: 8000 });

      // Show browser notification if tab is not focused
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.hidden
      ) {
        new Notification(n.title, { body: n.body });
      }

      // Mark as fired
      updateNotification.mutate({ id: n.id, update: { fired: true } });
    }
  }, [data, updateNotification]);

  return null;
}
