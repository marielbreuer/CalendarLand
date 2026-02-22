"use client";

import { useCalendars, useUpdateCalendar, useDeleteCalendar } from "@/hooks/useCalendars";
import { useState } from "react";

export function CalendarList() {
  const { data: calendars, isLoading } = useCalendars();
  const updateCalendar = useUpdateCalendar();
  const deleteCalendar = useDeleteCalendar();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2 px-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-8 rounded bg-[var(--bg-tertiary)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {calendars?.map((cal) => (
        <div
          key={cal.id}
          className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors relative"
        >
          <button
            onClick={() =>
              updateCalendar.mutate({
                id: cal.id,
                data: { isVisible: !cal.isVisible },
              })
            }
            className="flex-shrink-0 w-4 h-4 rounded border-2 transition-colors"
            style={{
              backgroundColor: cal.isVisible ? cal.color : "transparent",
              borderColor: cal.color,
            }}
          />
          <span className="text-sm truncate flex-1">{cal.name}</span>
          <button
            onClick={() =>
              setMenuOpenId(menuOpenId === cal.id ? null : cal.id)
            }
            className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          {menuOpenId === cal.id && (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg py-1">
              <button
                onClick={() => {
                  deleteCalendar.mutate(cal.id);
                  setMenuOpenId(null);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-[var(--bg-tertiary)]"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
