"use client";

import { TimeGrid } from "./TimeGrid";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import type { EventOccurrence } from "@/types/event";

interface DayViewProps {
  events: EventOccurrence[];
  calendarColors: Record<string, string>;
  onSlotClick: (date: Date, hour: number, minute: number) => void;
  onEventClick: (event: EventOccurrence) => void;
}

export function DayView({
  events,
  calendarColors,
  onSlotClick,
  onEventClick,
}: DayViewProps) {
  const selectedDate = useCalendarViewStore((s) => s.selectedDate);

  return (
    <div className="flex flex-col h-full">
      <TimeGrid
        days={[selectedDate]}
        events={events}
        calendarColors={calendarColors}
        onSlotClick={onSlotClick}
        onEventClick={onEventClick}
      />
    </div>
  );
}
