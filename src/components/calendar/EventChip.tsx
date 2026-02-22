"use client";

import { useDraggable } from "@dnd-kit/core";
import { getEventBgColor } from "@/lib/colors";
import { format } from "@/lib/dates";
import type { EventOccurrence } from "@/types/event";

interface EventChipProps {
  event: EventOccurrence;
  color: string;
  onClick: (event: EventOccurrence) => void;
}

export function EventChip({ event, color, onClick }: EventChipProps) {
  const start = new Date(event.startTime);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className="w-full text-left text-[11px] truncate rounded px-1.5 py-0.5 mb-0.5 flex items-center gap-1 hover:opacity-80 transition-opacity"
      style={{
        backgroundColor: getEventBgColor(color, 0.15),
        color,
      }}
    >
      {!event.isAllDay && (
        <span className="font-medium flex-shrink-0">
          {format(start, "h:mm")}
        </span>
      )}
      <span className="truncate">{event.title}</span>
    </button>
  );
}

export function DraggableEventChip({ event, color, onClick }: EventChipProps) {
  const start = new Date(event.startTime);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `month-event-${event.id}-${event.occurrenceDate}`,
    data: { type: "month-move", event },
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className="w-full text-left text-[11px] truncate rounded px-1.5 py-0.5 mb-0.5 flex items-center gap-1 hover:opacity-80 transition-opacity cursor-grab"
      style={{
        backgroundColor: getEventBgColor(color, 0.15),
        color,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      {!event.isAllDay && (
        <span className="font-medium flex-shrink-0">
          {format(start, "h:mm")}
        </span>
      )}
      <span className="truncate">{event.title}</span>
    </button>
  );
}
