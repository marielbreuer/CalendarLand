"use client";

import { TimeGrid } from "./TimeGrid";
import { getWeekDays, format, isToday, isSameDay } from "@/lib/dates";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import type { EventOccurrence } from "@/types/event";

interface WeekViewProps {
  events: EventOccurrence[];
  calendarColors: Record<string, string>;
  onSlotClick: (date: Date, hour: number, minute: number) => void;
  onEventClick: (event: EventOccurrence) => void;
}

export function WeekView({
  events,
  calendarColors,
  onSlotClick,
  onEventClick,
}: WeekViewProps) {
  const selectedDate = useCalendarViewStore((s) => s.selectedDate);
  const days = getWeekDays(selectedDate);

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b border-[var(--border-primary)] flex-shrink-0">
        <div className="w-16 flex-shrink-0" />
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="text-center py-2 border-r border-[var(--border-primary)] last:border-r-0"
            >
              <div className="text-[11px] uppercase font-medium text-[var(--text-tertiary)]">
                {format(day, "EEE")}
              </div>
              <div
                className={`text-xl font-medium mt-0.5 w-10 h-10 flex items-center justify-center mx-auto rounded-full ${
                  isToday(day)
                    ? "bg-[var(--accent)] text-white"
                    : ""
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time grid */}
      <TimeGrid
        days={days}
        events={events}
        calendarColors={calendarColors}
        onSlotClick={onSlotClick}
        onEventClick={onEventClick}
      />
    </div>
  );
}
