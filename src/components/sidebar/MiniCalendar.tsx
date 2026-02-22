"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { useCalendars } from "@/hooks/useCalendars";
import { useEvents } from "@/hooks/useEvents";
import { isToday } from "@/lib/dates";

export function MiniCalendar() {
  const { selectedDate, setSelectedDate, setView } = useCalendarViewStore();
  const [displayMonth, setDisplayMonth] = useState(new Date());

  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Fetch events for the displayed month range to highlight days with events
  const { data: calendars } = useCalendars();
  const visibleCalendarIds = useMemo(
    () => (calendars ?? []).filter((c) => c.isVisible).map((c) => c.id),
    [calendars]
  );

  const range = useMemo(
    () => ({ start: calendarStart, end: calendarEnd }),
    [calendarStart.getTime(), calendarEnd.getTime()]
  );

  const { data: eventsData } = useEvents(range, visibleCalendarIds);

  // Build a set of date strings (YYYY-MM-DD) that have events
  const daysWithEvents = useMemo(() => {
    const set = new Set<string>();
    if (eventsData?.events) {
      for (const ev of eventsData.events) {
        const d = new Date(ev.startTime);
        set.add(format(d, "yyyy-MM-dd"));
        // For multi-day / all-day events, also mark intermediate days
        if (ev.isAllDay && ev.endTime) {
          const end = new Date(ev.endTime);
          const current = new Date(d);
          while (current <= end) {
            set.add(format(current, "yyyy-MM-dd"));
            current.setDate(current.getDate() + 1);
          }
        }
      }
    }
    return set;
  }, [eventsData]);

  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className="px-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {format(displayMonth, "MMM yyyy")}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}
            className="p-0.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
            className="p-0.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0 text-center">
        {weekDays.map((d) => (
          <div key={d} className="text-[10px] font-medium text-[var(--text-tertiary)] py-1">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, displayMonth);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const hasEvents = daysWithEvents.has(format(day, "yyyy-MM-dd"));

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                setSelectedDate(day);
                setView("day");
              }}
              className={`relative text-[11px] w-7 h-7 rounded-full flex items-center justify-center transition-colors
                ${!inMonth ? "text-[var(--text-tertiary)]" : ""}
                ${selected ? "bg-[var(--accent)] text-white" : ""}
                ${today && !selected ? "bg-[var(--accent-light)] text-[var(--accent-hover)] font-bold" : ""}
                ${!selected && inMonth ? "hover:bg-[var(--bg-tertiary)]" : ""}
              `}
            >
              {format(day, "d")}
              {hasEvents && !selected && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
              {hasEvents && selected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
