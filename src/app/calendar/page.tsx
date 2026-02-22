"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { useUIStore } from "@/stores/uiStore";
import { useCalendars } from "@/hooks/useCalendars";
import { useEvents } from "@/hooks/useEvents";
import { getViewRange, setHours, setMinutes } from "@/lib/dates";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { MonthView } from "@/components/calendar/MonthView";
import { ListView } from "@/components/calendar/ListView";
import { EventModal } from "@/components/events/EventModal";
import { EventDetailPopover } from "@/components/events/EventDetailPopover";
import { CalendarDndContext } from "@/components/providers/CalendarDndContext";
import { TaskPanel } from "@/components/tasks/TaskPanel";
import type { EventOccurrence } from "@/types/event";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="flex border-b border-[var(--border-primary)] p-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 space-y-2">
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-12 mx-auto" />
            <div className="h-8 bg-[var(--bg-tertiary)] rounded-full w-8 mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-12 h-4 bg-[var(--bg-tertiary)] rounded" />
            <div className="flex-1 h-12 bg-[var(--bg-tertiary)] rounded-md" style={{ marginLeft: `${(i * 13) % 40}%`, width: `${30 + (i * 7) % 40}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <div className="text-4xl">!</div>
        <p className="text-[var(--text-secondary)] text-sm">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { view, selectedDate, setSelectedDate, setView } = useCalendarViewStore();
  const { openCreateEventModal, openPopover } = useUIStore();
  const { data: calendars, isLoading: calendarsLoading, isError: calendarsError } = useCalendars();

  // Responsive: use day view on mobile when week is selected
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 640);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const effectiveView = isMobile && view === "week" ? "day" : (isMobile && view === "list" ? "list" : view);

  const visibleCalendarIds = useMemo(
    () => (calendars ?? []).filter((c) => c.isVisible).map((c) => c.id),
    [calendars]
  );

  const calendarColors = useMemo(() => {
    const map: Record<string, string> = {};
    calendars?.forEach((c) => {
      map[c.id] = c.color;
    });
    return map;
  }, [calendars]);

  const range = useMemo(
    () => getViewRange(selectedDate, effectiveView),
    [selectedDate, effectiveView]
  );

  const { data, isLoading: eventsLoading, isError: eventsError } = useEvents(range, visibleCalendarIds);
  const events: EventOccurrence[] = data?.events ?? [];

  function handleSlotClick(date: Date, hour: number, minute: number) {
    const start = setMinutes(setHours(date, hour), minute);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const defaultCalendarId = visibleCalendarIds[0] ?? "";

    openCreateEventModal({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      calendarId: defaultCalendarId,
    });
  }

  // Track last click position for popover placement
  const lastClickPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    function track(e: MouseEvent) {
      lastClickPos.current = { x: e.clientX, y: e.clientY };
    }
    document.addEventListener("click", track, true);
    return () => document.removeEventListener("click", track, true);
  }, []);

  function handleEventClick(event: EventOccurrence) {
    openPopover(event, lastClickPos.current);
  }

  function handleDayClick(date: Date) {
    setSelectedDate(date);
    setView("day");
  }

  if (calendarsError || eventsError) {
    return <ErrorState message="Failed to load calendar data. Check your connection." />;
  }

  if (calendarsLoading || (eventsLoading && events.length === 0)) {
    return <LoadingSkeleton />;
  }

  return (
    <CalendarDndContext calendarColors={calendarColors} allEvents={events}>
      <div className="flex h-full">
        <div className="flex-1 overflow-auto">
          {effectiveView === "week" && (
            <WeekView
              events={events}
              calendarColors={calendarColors}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
            />
          )}
          {effectiveView === "day" && (
            <DayView
              events={events}
              calendarColors={calendarColors}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
            />
          )}
          {effectiveView === "month" && (
            <MonthView
              events={events}
              calendarColors={calendarColors}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          )}
          {effectiveView === "list" && (
            <ListView
              events={events}
              calendarColors={calendarColors}
              onEventClick={handleEventClick}
            />
          )}
        </div>
        <TaskPanel />
      </div>
      <EventModal allEvents={events} />
      <EventDetailPopover calendarColors={calendarColors} />
    </CalendarDndContext>
  );
}
