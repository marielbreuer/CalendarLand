"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useReorderTasks } from "@/hooks/useTasks";
import type { Task, TaskStatus } from "@/types/task";

interface KanbanBoardProps {
  tasks: Task[];
  calendarColors: Record<string, string>;
  isLoading?: boolean;
}

const columns: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "doing", label: "In Progress" },
  { status: "done", label: "Done" },
];

export function KanbanBoard({ tasks, calendarColors, isLoading }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const reorderTasks = useReorderTasks();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus) =>
      tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [tasks]
  );

  function findColumn(id: string): TaskStatus | null {
    // Check if it's a column id
    const colMatch = id.match(/^column-(.+)$/);
    if (colMatch) return colMatch[1] as TaskStatus;

    // It's a task id — find which column it belongs to
    const task = tasks.find((t) => t.id === id);
    return task ? (task.status as TaskStatus) : null;
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "kanban-card") {
      setActiveTask(data.task as Task);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const activeColumn = findColumn(activeId);
      const overColumn = findColumn(overId);

      if (!activeColumn || !overColumn || activeColumn === overColumn) return;

      // Moving to a different column — optimistic update
      queryClient.setQueriesData<{ tasks: Task[] }>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((t) =>
              t.id === activeId ? { ...t, status: overColumn } : t
            ),
          };
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const activeColumn = findColumn(activeId);
      const overColumn = findColumn(overId);

      if (!activeColumn || !overColumn) return;

      const columnTasks = getTasksByStatus(overColumn);
      const activeTask = tasks.find((t) => t.id === activeId);
      if (!activeTask) return;

      // Calculate new sort orders
      let reorderItems: { id: string; sortOrder: number; status?: TaskStatus }[];

      if (activeColumn === overColumn) {
        // Reorder within same column
        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        reorderItems = reordered.map((t, i) => ({
          id: t.id,
          sortOrder: i,
          status: overColumn,
        }));
      } else {
        // Moved to different column
        const overIndex = columnTasks.findIndex((t) => t.id === overId);
        const insertIndex = overIndex === -1 ? columnTasks.length : overIndex;

        // Build new list for the target column
        const targetTasks = columnTasks.filter((t) => t.id !== activeId);
        targetTasks.splice(insertIndex, 0, { ...activeTask, status: overColumn });

        reorderItems = targetTasks.map((t, i) => ({
          id: t.id,
          sortOrder: i,
          status: overColumn,
        }));
      }

      // Optimistic update
      queryClient.setQueriesData<{ tasks: Task[] }>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          const orderMap = new Map(reorderItems.map((r) => [r.id, r]));
          return {
            ...old,
            tasks: old.tasks.map((t) => {
              const update = orderMap.get(t.id);
              if (update) {
                return {
                  ...t,
                  sortOrder: update.sortOrder,
                  ...(update.status && { status: update.status }),
                };
              }
              return t;
            }),
          };
        }
      );

      reorderTasks.mutate(reorderItems, {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks]
  );

  if (isLoading) {
    return (
      <div className="flex gap-6 p-6 overflow-x-auto">
        {columns.map((col) => (
          <div key={col.status} className="flex-shrink-0 w-80">
            <div className="h-8 w-24 rounded bg-[var(--bg-tertiary)] animate-pulse mb-3" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-[var(--bg-secondary)] animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 p-6 overflow-x-auto h-full">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            tasks={getTasksByStatus(col.status)}
            calendarColors={calendarColors}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="w-80">
            <KanbanCard
              task={activeTask}
              calendarColor={calendarColors[activeTask.calendarId]}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
