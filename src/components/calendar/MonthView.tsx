"use client";

import { useDroppable } from "@dnd-kit/core";
import { getMonthDays, isSameDay, isSameMonth, isToday, format } from "@/lib/dates";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { DraggableEventChip } from "./EventChip";
import type { EventOccurrence } from "@/types/event";

interface MonthViewProps {
  events: EventOccurrence[];
  calendarColors: Record<string, string>;
  onDayClick: (date: Date) => void;
  onEventClick: (event: EventOccurrence) => void;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_EVENTS = 3;

function DroppableMonthDay({
  day,
  children,
  className,
  onClick,
}: {
  day: Date;
  children: React.ReactNode;
  className: string;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `month-day-${day.toISOString()}`,
    data: { dayDate: day.toISOString() },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: isOver ? "rgba(236, 72, 153, 0.08)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function MonthView({
  events,
  calendarColors,
  onDayClick,
  onEventClick,
}: MonthViewProps) {
  const selectedDate = useCalendarViewStore((s) => s.selectedDate);
  const days = getMonthDays(selectedDate);
  const weeks: Date[][] = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[var(--border-primary)]">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-[var(--text-tertiary)] py-2 uppercase tracking-wider"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex-1 grid relative" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b border-[var(--border-primary)] last:border-b-0">
            {week.map((day) => {
              const inMonth = isSameMonth(day, selectedDate);
              const today = isToday(day);
              const dayEvents = events.filter((e) =>
                isSameDay(new Date(e.startTime), day)
              );
              const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
              const moreCount = dayEvents.length - MAX_VISIBLE_EVENTS;

              return (
                <DroppableMonthDay
                  key={day.toISOString()}
                  day={day}
                  onClick={() => onDayClick(day)}
                  className={`border-r border-[var(--border-primary)] last:border-r-0 p-1 min-h-[100px] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors ${
                    !inMonth ? "bg-[var(--bg-tertiary)] opacity-50" : ""
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    <span
                      className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                        today
                          ? "bg-[var(--accent)] text-white font-bold"
                          : inMonth
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-0">
                    {visibleEvents.map((event) => (
                      <DraggableEventChip
                        key={event.id + event.occurrenceDate}
                        event={event}
                        color={calendarColors[event.calendarId] || "#ec4899"}
                        onClick={onEventClick}
                      />
                    ))}
                    {moreCount > 0 && (
                      <div className="text-[10px] text-[var(--text-secondary)] pl-1.5 font-medium">
                        +{moreCount} more
                      </div>
                    )}
                  </div>
                </DroppableMonthDay>
              );
            })}
          </div>
        ))}

        {/* Empty state overlay */}
        {events.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-sm text-[var(--text-tertiary)]">No events this month</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 opacity-60">Click on a day to add one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
