"use client";

import { useRef, useEffect } from "react";
import { HOUR_HEIGHT } from "./TimeGutter";
import { TimeGutter } from "./TimeGutter";
import { CurrentTimeLine } from "./CurrentTimeLine";
import { EventBlock } from "./EventBlock";
import { AllDayRow } from "./AllDayRow";
import { DroppableDayColumn } from "./DroppableDayColumn";
import { layoutOverlappingEvents } from "@/lib/layout";
import { isSameDay } from "@/lib/dates";
import { useSettings } from "@/hooks/useSettings";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import type { EventOccurrence } from "@/types/event";

interface TimeGridProps {
  days: Date[];
  events: EventOccurrence[];
  calendarColors: Record<string, string>;
  onSlotClick: (date: Date, hour: number, minute: number) => void;
  onEventClick: (event: EventOccurrence) => void;
}

export function TimeGrid({
  days,
  events,
  calendarColors,
  onSlotClick,
  onEventClick,
}: TimeGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const gridHeight = 24 * HOUR_HEIGHT;
  const { data: settings } = useSettings();
  const secondaryTz = settings?.secondaryTimezone || null;

  // Auto-scroll to current time on first render
  useEffect(() => {
    if (gridRef.current && !scrolledRef.current) {
      const now = new Date();
      const scrollTo = Math.max(0, ((now.getHours() - 1) * HOUR_HEIGHT));
      gridRef.current.scrollTop = scrollTo;
      scrolledRef.current = true;
    }
  }, []);

  function handleGridClick(day: Date, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = (y / gridHeight) * 24 * 60;
    const snapped = Math.floor(totalMinutes / 15) * 15;
    const hour = Math.floor(snapped / 60);
    const minute = snapped % 60;
    onSlotClick(day, hour, minute);
  }

  return (
    <div className="flex flex-col flex-1">
      <AllDayRow
        days={days}
        events={events}
        calendarColors={calendarColors}
        onEventClick={onEventClick}
      />
      <div ref={gridRef} className="flex flex-1 overflow-y-auto">
        {/* Secondary timezone gutter */}
        {secondaryTz && (
          <div className="relative w-12 flex-shrink-0 border-r border-[var(--border-primary)] border-dashed">
            {hours.map((hour) => {
              // Create a date for this hour today in UTC/local, then convert to secondary tz
              const nowDate = new Date();
              const dateForHour = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), hour, 0, 0);
              let label = "";
              try {
                const zonedTime = toZonedTime(dateForHour, secondaryTz);
                label = formatInTimeZone(dateForHour, secondaryTz, "h a").toLowerCase();
                void zonedTime;
              } catch {
                label = "";
              }
              return (
                <div
                  key={hour}
                  className="relative text-[10px] text-[var(--text-tertiary)] text-center"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {hour > 0 && label && (
                    <span className="absolute -top-[7px] left-0 right-0 px-0.5 truncate">
                      {label}
                    </span>
                  )}
                </div>
              );
            })}
            <div
              className="absolute top-1 left-0 right-0 text-center text-[9px] text-[var(--text-tertiary)] opacity-70 leading-tight px-0.5"
              style={{ writingMode: "vertical-lr", position: "absolute", top: 4, left: 0, right: 0, height: 60 }}
            >
              {secondaryTz.split("/").pop()?.replace(/_/g, " ") ?? secondaryTz}
            </div>
          </div>
        )}
        <TimeGutter />
        <div
          className="flex-1 grid relative"
          style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
        >
          {days.map((day, dayIndex) => {
            const dayEvents = events.filter(
              (e) => !e.isAllDay && isSameDay(new Date(e.startTime), day)
            );
            const layouted = layoutOverlappingEvents(dayEvents);

            return (
              <DroppableDayColumn
                key={day.toISOString()}
                dayIndex={dayIndex}
                dayDate={day.toISOString()}
                className="relative border-r border-[var(--border-primary)] last:border-r-0"
                style={{ height: gridHeight }}
                onClick={(e) => handleGridClick(day, e)}
              >
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-[var(--border-primary)]"
                    style={{ top: hour * HOUR_HEIGHT }}
                  >
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-[var(--border-primary)] opacity-40"
                      style={{ top: HOUR_HEIGHT / 2 }}
                    />
                  </div>
                ))}

                {/* Events */}
                {layouted.map(({ event, column, totalColumns }) => (
                  <EventBlock
                    key={event.id + event.occurrenceDate}
                    event={event}
                    color={calendarColors[event.calendarId] || "#ec4899"}
                    column={column}
                    totalColumns={totalColumns}
                    dayIndex={dayIndex}
                    onClick={onEventClick}
                  />
                ))}

                <CurrentTimeLine day={day} />
              </DroppableDayColumn>
            );
          })}

          {/* Empty state overlay */}
          {events.filter((e) => !e.isAllDay).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-sm text-[var(--text-tertiary)]">No events scheduled</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 opacity-60">Click on the grid to create one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
