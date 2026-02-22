"use client";

import { useDraggable } from "@dnd-kit/core";
import { HOUR_HEIGHT } from "./TimeGutter";
import { getEventBgColor } from "@/lib/colors";
import { format } from "@/lib/dates";
import type { EventOccurrence } from "@/types/event";

interface EventBlockProps {
  event: EventOccurrence;
  color: string;
  column: number;
  totalColumns: number;
  dayIndex: number;
  onClick: (event: EventOccurrence) => void;
}

export function EventBlock({
  event,
  color,
  column,
  totalColumns,
  dayIndex,
  onClick,
}: EventBlockProps) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const durationMinutes = Math.max(endMinutes - startMinutes, 15);

  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (durationMinutes / 60) * HOUR_HEIGHT;

  const width = `calc(${100 / totalColumns}% - 2px)`;
  const left = `calc(${(column / totalColumns) * 100}% + 1px)`;

  const dragId = `event-move-${event.id}-${event.occurrenceDate}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: dragId,
    data: { type: "move", event, dayIndex },
  });

  const resizeId = `event-resize-${event.id}-${event.occurrenceDate}`;
  const {
    attributes: resizeAttrs,
    listeners: resizeListeners,
    setNodeRef: setResizeRef,
  } = useDraggable({
    id: resizeId,
    data: { type: "resize", event, dayIndex },
  });

  const isFocus = (event as EventOccurrence & { isFocusTime?: boolean }).isFocusTime ?? false;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className="absolute rounded-md px-2 py-1 overflow-hidden cursor-grab text-left transition-opacity hover:opacity-90 z-10 group"
      style={{
        top,
        height: Math.max(height, 20),
        left,
        width,
        backgroundColor: getEventBgColor(color, 0.2),
        borderLeft: `3px ${isFocus ? "dashed" : "solid"} ${color}`,
        opacity: isDragging ? 0.3 : 1,
        ...(isFocus && {
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)`,
          backgroundColor: getEventBgColor(color, 0.15),
        }),
      }}
    >
      <p className="text-xs font-medium truncate flex items-center gap-1" style={{ color }}>
        {isFocus && <span title="Focus Time">🎯</span>}
        {event.title}
      </p>
      {durationMinutes >= 30 && (
        <p className="text-[10px] text-[var(--text-secondary)] truncate">
          {format(start, "h:mm a")} &ndash; {format(end, "h:mm a")}
        </p>
      )}

      {/* Resize handle */}
      {height >= 30 && (
        <div
          ref={setResizeRef}
          {...resizeAttrs}
          {...resizeListeners}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => {
            e.stopPropagation();
            resizeListeners?.onPointerDown?.(e);
          }}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: color + "40" }}
        />
      )}
    </div>
  );
}
