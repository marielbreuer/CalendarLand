"use client";

import { useMemo } from "react";
import { format, isSameDay, startOfWeek, addDays } from "date-fns";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { isToday } from "@/lib/dates";
import { getEventBgColor } from "@/lib/colors";
import type { EventOccurrence } from "@/types/event";

interface ListViewProps {
  events: EventOccurrence[];
  calendarColors: Record<string, string>;
  onEventClick: (event: EventOccurrence) => void;
}

export function ListView({ events, calendarColors, onEventClick }: ListViewProps) {
  const selectedDate = useCalendarViewStore((s) => s.selectedDate);

  // Group events by day of the week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = useMemo(() => {
    const grouped: Map<string, EventOccurrence[]> = new Map();
    for (const day of weekDays) {
      const key = format(day, "yyyy-MM-dd");
      grouped.set(key, []);
    }
    for (const event of events) {
      const eventDate = new Date(event.startTime);
      const key = format(eventDate, "yyyy-MM-dd");
      if (grouped.has(key)) {
        grouped.get(key)!.push(event);
      }
    }
    return grouped;
  }, [events, weekStart.getTime()]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto px-4 py-6 space-y-2">
        {weekDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const today = isToday(day);

          return (
            <div key={key} className="flex gap-4">
              {/* Day label */}
              <div className="flex-shrink-0 w-20 pt-3 text-right">
                <div
                  className={`text-xs font-medium uppercase ${
                    today ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-2xl font-bold leading-tight ${
                    today ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>

              {/* Events */}
              <div className="flex-1 min-h-[60px] border-l-2 border-[var(--border-primary)] pl-4 py-2 space-y-2">
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)] italic pt-2">
                    No events
                  </p>
                ) : (
                  dayEvents.map((event) => {
                    const color = calendarColors[event.calendarId] || "#ec4899";
                    const start = new Date(event.startTime);
                    const end = new Date(event.endTime);

                    return (
                      <button
                        key={event.id + event.occurrenceDate}
                        onClick={() => onEventClick(event)}
                        className="w-full text-left rounded-xl px-4 py-3 transition-all hover:shadow-md hover:scale-[1.01] border border-[var(--border-primary)]"
                        style={{
                          backgroundColor: getEventBgColor(color, 0.1),
                          borderLeftWidth: "4px",
                          borderLeftColor: color,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {event.title}
                          </span>
                          {event.isRecurring && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{
                                backgroundColor: getEventBgColor(color, 0.15),
                                color,
                              }}
                            >
                              Recurring
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-1" style={{ color }}>
                          {event.isAllDay
                            ? "All day"
                            : `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`}
                        </div>
                        {event.location && (
                          <div className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                            {event.location}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
