"use client";

import { useState } from "react";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { RunningTimerIndicator } from "@/components/time-tracking/RunningTimerIndicator";
import { SidebarBottomSheet } from "./SidebarBottomSheet";
import { format } from "date-fns";

export function MobileHeader() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { selectedDate, goToToday } = useCalendarViewStore();

  return (
    <>
      <header
        className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-primary)] flex-shrink-0"
        style={{ background: "var(--grad-hero)" }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-white/40 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <button
          onClick={goToToday}
          className="text-sm font-semibold"
          style={{ color: "var(--pink-deep)" }}
        >
          {format(selectedDate, "MMMM yyyy")}
        </button>

        <RunningTimerIndicator />
      </header>

      <SidebarBottomSheet open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
