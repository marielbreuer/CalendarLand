"use client";

import type { EventOccurrence } from "@/types/event";
import { getEventBgColor } from "@/lib/colors";
import { isSameDay } from "@/lib/dates";

interface AllDayRowProps {
  days: Date[];
  events: EventOccurrence[];
  calendarColors: Record<string, string>;
  onEventClick: (event: EventOccurrence) => void;
}

export function AllDayRow({
  days,
  events,
  calendarColors,
  onEventClick,
}: AllDayRowProps) {
  const allDayEvents = events.filter((e) => e.isAllDay);

  if (allDayEvents.length === 0) return null;

  return (
    <div className="flex border-b border-[var(--border-primary)]">
      <div className="w-16 flex-shrink-0 border-r border-[var(--border-primary)] text-[10px] text-[var(--text-tertiary)] p-1">
        all-day
      </div>
      <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {days.map((day) => {
          const dayEvents = allDayEvents.filter((e) =>
            isSameDay(new Date(e.startTime), day)
          );
          return (
            <div
              key={day.toISOString()}
              className="min-h-[28px] p-0.5 border-r border-[var(--border-primary)] last:border-r-0"
            >
              {dayEvents.map((event) => {
                const color = calendarColors[event.calendarId] || "#ec4899";
                return (
                  <button
                    key={event.id + event.occurrenceDate}
                    onClick={() => onEventClick(event)}
                    className="w-full text-left text-[10px] font-medium truncate rounded px-1 py-0.5 mb-0.5"
                    style={{
                      backgroundColor: getEventBgColor(color, 0.2),
                      color,
                    }}
                  >
                    {event.title}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
