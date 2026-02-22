"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import { HOUR_HEIGHT } from "@/components/calendar/TimeGutter";
import { getEventBgColor } from "@/lib/colors";
import { detectConflictsSimple as detectConflicts } from "@/lib/conflict";
import { useUpdateEvent, useCreateEvent } from "@/hooks/useEvents";
import { useUpdateTask } from "@/hooks/useTasks";
import { RecurrenceScopeDialog } from "@/components/events/RecurrenceScopeDialog";
import { format } from "@/lib/dates";
import { toast } from "sonner";
import type { EventOccurrence, RecurrenceScope } from "@/types/event";
import type { Task } from "@/types/task";

interface CalendarDndContextProps {
  children: React.ReactNode;
  calendarColors: Record<string, string>;
  allEvents?: EventOccurrence[];
}

interface PendingDrag {
  event: EventOccurrence;
  newStartTime: string;
  newEndTime: string;
}

export function CalendarDndContext({
  children,
  calendarColors,
  allEvents = [],
}: CalendarDndContextProps) {
  const [activeEvent, setActiveEvent] = useState<EventOccurrence | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragType, setDragType] = useState<"move" | "resize" | "month-move" | "task-to-event" | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [pendingDrag, setPendingDrag] = useState<PendingDrag | null>(null);
  const activeDayIndex = useRef<number>(0);
  const updateEvent = useUpdateEvent();
  const createEvent = useCreateEvent();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Optimistically update the events cache
  function applyOptimisticUpdate(
    eventId: string,
    occurrenceDate: string,
    newStart: string,
    newEnd: string
  ) {
    queryClient.setQueriesData<{ events: EventOccurrence[] }>(
      { queryKey: ["events"] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          events: old.events.map((e) => {
            if (
              (e.id === eventId || e.masterEventId === eventId) &&
              e.occurrenceDate === occurrenceDate
            ) {
              return { ...e, startTime: newStart, endTime: newEnd };
            }
            return e;
          }),
        };
      }
    );
  }

  function executeDrag(
    ev: EventOccurrence,
    newStart: string,
    newEnd: string,
    scope?: RecurrenceScope
  ) {
    const eventId = ev.masterEventId || ev.id;

    // Optimistic update
    applyOptimisticUpdate(eventId, ev.occurrenceDate, newStart, newEnd);

    updateEvent.mutate(
      {
        id: eventId,
        data: { startTime: newStart, endTime: newEnd },
        scope,
        occurrenceDate: scope ? ev.occurrenceDate : undefined,
      },
      {
        onError: (err) => {
          // Rollback: refetch from server
          queryClient.invalidateQueries({ queryKey: ["events"] });
          toast.error(err.message);
        },
      }
    );
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (!data) return;

    if (data.type === "task-to-event") {
      setActiveTask(data.task as Task);
      setDragType("task-to-event");
      setActiveEvent(null);
      return;
    }

    setActiveEvent(data.event as EventOccurrence);
    setActiveTask(null);
    setDragType(data.type as "move" | "resize" | "month-move");
    setHasConflict(false);
    activeDayIndex.current = data.dayIndex ?? 0;
  }, []);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!activeEvent || dragType === "month-move") return;

      const { delta, over } = event;
      const SNAP = 15;
      const deltaMinutes =
        Math.round(((delta.y / HOUR_HEIGHT) * 60) / SNAP) * SNAP;

      let dayDelta = 0;
      if (over?.data.current?.dayIndex !== undefined) {
        dayDelta =
          (over.data.current.dayIndex as number) - activeDayIndex.current;
      }

      const ms = deltaMinutes * 60000 + dayDelta * 86400000;

      if (dragType === "move") {
        const newStart = new Date(
          new Date(activeEvent.startTime).getTime() + ms
        );
        const newEnd = new Date(
          new Date(activeEvent.endTime).getTime() + ms
        );
        const conflicts = detectConflicts(
          newStart,
          newEnd,
          allEvents,
          activeEvent.id
        );
        setHasConflict(conflicts.length > 0);
      } else if (dragType === "resize") {
        const start = new Date(activeEvent.startTime);
        const newEnd = new Date(
          new Date(activeEvent.endTime).getTime() + deltaMinutes * 60000
        );
        if (newEnd > start) {
          const conflicts = detectConflicts(
            start,
            newEnd,
            allEvents,
            activeEvent.id
          );
          setHasConflict(conflicts.length > 0);
        }
      }
    },
    [activeEvent, dragType, allEvents]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { delta, over } = event;

      // Task-to-event drag
      if (dragType === "task-to-event" && activeTask) {
        if (over?.data.current?.dayDate) {
          // Dropped on a month day cell
          const targetDate = new Date(over.data.current.dayDate as string);
          targetDate.setHours(9, 0, 0, 0);
          const endDate = new Date(targetDate.getTime() + 60 * 60 * 1000);

          createEvent.mutate(
            {
              title: activeTask.title,
              description: activeTask.description || undefined,
              startTime: targetDate.toISOString(),
              endTime: endDate.toISOString(),
              calendarId: activeTask.calendarId,
            },
            {
              onSuccess: () => {
                toast.success("Event created from task");
                updateTask.mutate({ id: activeTask.id, data: { status: "doing" } });
              },
              onError: (err) => toast.error(err.message),
            }
          );
        } else if (over?.data.current?.dayIndex !== undefined) {
          // Dropped on a time grid column — calculate time from drop position
          const dayIndex = over.data.current.dayIndex as number;
          const SNAP = 15;
          const deltaMinutes = Math.round(((delta.y / HOUR_HEIGHT) * 60) / SNAP) * SNAP;

          // Use 9am as a base, adjust by delta
          const baseDate = new Date();
          baseDate.setHours(9, 0, 0, 0);
          baseDate.setDate(baseDate.getDate() + dayIndex);
          const targetStart = new Date(baseDate.getTime() + deltaMinutes * 60000);
          const targetEnd = new Date(targetStart.getTime() + 60 * 60 * 1000);

          createEvent.mutate(
            {
              title: activeTask.title,
              description: activeTask.description || undefined,
              startTime: targetStart.toISOString(),
              endTime: targetEnd.toISOString(),
              calendarId: activeTask.calendarId,
            },
            {
              onSuccess: () => {
                toast.success("Event created from task");
                updateTask.mutate({ id: activeTask.id, data: { status: "doing" } });
              },
              onError: (err) => toast.error(err.message),
            }
          );
        }

        setActiveTask(null);
        setDragType(null);
        return;
      }

      if (!activeEvent || !dragType) {
        setActiveEvent(null);
        setActiveTask(null);
        setDragType(null);
        return;
      }

      // Month view drag: day-to-day move
      if (dragType === "month-move") {
        if (!over?.data.current?.dayDate) {
          setActiveEvent(null);
          setDragType(null);
          return;
        }

        const targetDate = new Date(over.data.current.dayDate as string);
        const oldStart = new Date(activeEvent.startTime);
        const dayDiff = Math.round(
          (targetDate.getTime() -
            new Date(
              oldStart.getFullYear(),
              oldStart.getMonth(),
              oldStart.getDate()
            ).getTime()) /
            86400000
        );

        if (dayDiff === 0) {
          setActiveEvent(null);
          setDragType(null);
          return;
        }

        const ms = dayDiff * 86400000;
        const newStart = new Date(oldStart.getTime() + ms).toISOString();
        const newEnd = new Date(
          new Date(activeEvent.endTime).getTime() + ms
        ).toISOString();

        if (activeEvent.isRecurring) {
          setPendingDrag({ event: activeEvent, newStartTime: newStart, newEndTime: newEnd });
        } else {
          executeDrag(activeEvent, newStart, newEnd);
        }

        setActiveEvent(null);
        setDragType(null);
        return;
      }

      // Time grid drag (move or resize)
      const SNAP = 15;
      const deltaMinutes =
        Math.round(((delta.y / HOUR_HEIGHT) * 60) / SNAP) * SNAP;

      if (dragType === "move") {
        let dayDelta = 0;
        if (over?.data.current?.dayIndex !== undefined) {
          dayDelta =
            (over.data.current.dayIndex as number) - activeDayIndex.current;
        }

        if (deltaMinutes === 0 && dayDelta === 0) {
          setActiveEvent(null);
          setDragType(null);
          return;
        }

        const ms = deltaMinutes * 60000 + dayDelta * 86400000;
        const newStart = new Date(
          new Date(activeEvent.startTime).getTime() + ms
        ).toISOString();
        const newEnd = new Date(
          new Date(activeEvent.endTime).getTime() + ms
        ).toISOString();

        if (activeEvent.isRecurring) {
          setPendingDrag({ event: activeEvent, newStartTime: newStart, newEndTime: newEnd });
        } else {
          executeDrag(activeEvent, newStart, newEnd);
        }
      } else if (dragType === "resize") {
        if (deltaMinutes === 0) {
          setActiveEvent(null);
          setDragType(null);
          return;
        }

        const oldEnd = new Date(activeEvent.endTime);
        const newEnd = new Date(oldEnd.getTime() + deltaMinutes * 60000);
        const start = new Date(activeEvent.startTime);

        if (newEnd.getTime() - start.getTime() < 15 * 60000) {
          setActiveEvent(null);
          setDragType(null);
          return;
        }

        const newEndStr = newEnd.toISOString();

        if (activeEvent.isRecurring) {
          setPendingDrag({
            event: activeEvent,
            newStartTime: activeEvent.startTime,
            newEndTime: newEndStr,
          });
        } else {
          executeDrag(activeEvent, activeEvent.startTime, newEndStr);
        }
      }

      setActiveEvent(null);
      setDragType(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEvent, dragType]
  );

  function handleScopeSelect(scope: RecurrenceScope) {
    if (!pendingDrag) return;
    executeDrag(
      pendingDrag.event,
      pendingDrag.newStartTime,
      pendingDrag.newEndTime,
      scope
    );
    setPendingDrag(null);
  }

  const color = activeEvent
    ? calendarColors[activeEvent.calendarId] || "#ec4899"
    : "#3b82f6";

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeEvent && (dragType === "move" || dragType === "month-move") && (
          <div
            className="rounded-md px-2 py-1 shadow-lg pointer-events-none"
            style={{
              backgroundColor: hasConflict
                ? "rgba(249, 115, 22, 0.25)"
                : getEventBgColor(color, 0.3),
              borderLeft: `3px solid ${hasConflict ? "#f97316" : color}`,
              width: 180,
              opacity: 0.9,
            }}
          >
            <p
              className="text-xs font-medium truncate"
              style={{ color: hasConflict ? "#f97316" : color }}
            >
              {activeEvent.title}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">
              {format(new Date(activeEvent.startTime), "h:mm a")}
            </p>
            {hasConflict && (
              <p className="text-[10px] font-medium text-orange-500 mt-0.5">
                Conflicts with another event
              </p>
            )}
          </div>
        )}
        {activeTask && dragType === "task-to-event" && (
          <div
            className="rounded-md px-2 py-1 shadow-lg pointer-events-none"
            style={{
              backgroundColor: getEventBgColor(calendarColors[activeTask.calendarId] || "#3b82f6", 0.3),
              borderLeft: `3px solid ${calendarColors[activeTask.calendarId] || "#3b82f6"}`,
              width: 180,
              opacity: 0.9,
            }}
          >
            <p className="text-xs font-medium truncate" style={{ color: calendarColors[activeTask.calendarId] || "#3b82f6" }}>
              {activeTask.title}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">
              Drop to schedule
            </p>
          </div>
        )}
      </DragOverlay>

      <RecurrenceScopeDialog
        open={!!pendingDrag}
        action="edit"
        onSelect={handleScopeSelect}
        onCancel={() => setPendingDrag(null)}
      />
    </DndContext>
  );
}
