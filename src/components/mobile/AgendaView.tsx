"use client";

import { useMemo } from "react";
import { addDays, startOfDay, format, isSameDay, isToday } from "date-fns";
import { useEvents } from "@/hooks/useEvents";
import { useCalendars } from "@/hooks/useCalendars";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { useSwipe } from "@/hooks/useSwipe";
import type { EventOccurrence } from "@/types/event";
import { useUIStore } from "@/stores/uiStore";

const DAYS_AHEAD = 30;

function AgendaEventRow({ event, color }: { event: EventOccurrence; color: string }) {
  const openPopover = useUIStore((s) => s.openPopover);

  function handleClick(e: React.MouseEvent) {
    openPopover(event, { x: e.clientX, y: e.clientY });
  }

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left"
    >
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.title}</p>
        <p className="text-xs text-[var(--text-tertiary)]">
          {event.isAllDay
            ? "All day"
            : `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`}
        </p>
        {event.location && (
          <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
            📍 {event.location}
          </p>
        )}
      </div>
    </button>
  );
}

export function AgendaView() {
  const { selectedDate, setSelectedDate } = useCalendarViewStore();
  const { data: calendarsData } = useCalendars();
  const calendars = calendarsData ?? [];
  const visibleCalendarIds = calendars.filter((c) => c.isVisible).map((c) => c.id);

  const rangeStart = startOfDay(new Date());
  const rangeEnd = addDays(rangeStart, DAYS_AHEAD);

  const { data: eventsData, isLoading } = useEvents(
    { start: rangeStart, end: rangeEnd },
    visibleCalendarIds
  );

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => setSelectedDate(addDays(selectedDate, 1)),
    onSwipeRight: () => setSelectedDate(addDays(selectedDate, -1)),
  });

  const grouped = useMemo(() => {
    const events = eventsData?.events ?? [];
    const days: Array<{ date: Date; events: EventOccurrence[] }> = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const day = addDays(rangeStart, i);
      const dayEvents = events
        .filter((e) => isSameDay(new Date(e.startTime), day))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      if (dayEvents.length > 0) {
        days.push({ date: day, events: dayEvents });
      }
    }
    return days;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsData]);

  const calendarColorMap = useMemo(() => {
    return Object.fromEntries(calendars.map((c) => [c.id, c.color]));
  }, [calendars]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-12 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      {...swipeHandlers}
    >
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)]">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">No upcoming events</p>
        </div>
      ) : (
        grouped.map(({ date, events }) => (
          <div key={date.toISOString()}>
            {/* Day header */}
            <div
              className="sticky top-0 z-10 px-4 py-2 text-xs font-semibold uppercase tracking-wide border-b border-[var(--border-primary)]"
              style={{
                background: "var(--bg-primary)",
                color: isToday(date) ? "var(--pink-deep)" : "var(--text-secondary)",
              }}
            >
              {isToday(date) ? "Today" : format(date, "EEEE, MMMM d")}
            </div>
            {events.map((event) => (
              <AgendaEventRow
                key={`${event.id}-${event.startTime}`}
                event={event}
                color={calendarColorMap[event.calendarId] ?? "#3b82f6"}
              />
            ))}
          </div>
        ))
      )}
      <div className="h-4 text-center text-xs text-[var(--text-tertiary)] py-6">
        Showing next {DAYS_AHEAD} days
      </div>
    </div>
  );
}
