"use client";

import { useDraggable } from "@dnd-kit/core";
import { useUIStore } from "@/stores/uiStore";
import type { Task, TaskPriority } from "@/types/task";

interface TaskChipProps {
  task: Task;
  calendarColor?: string;
}

const priorityDot: Record<TaskPriority, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-500",
  low: "bg-gray-400",
};

export function TaskChip({ task, calendarColor = "#3b82f6" }: TaskChipProps) {
  const openEditTaskModal = useUIStore((s) => s.openEditTaskModal);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-chip-${task.id}`,
    data: {
      type: "task-to-event",
      task,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => openEditTaskModal(task.id)}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
        isDragging
          ? "opacity-50 shadow-lg"
          : "hover:bg-[var(--bg-tertiary)]"
      }`}
      style={{
        borderLeft: `3px solid ${calendarColor}`,
      }}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[task.priority]}`} />
      <span className="text-xs truncate flex-1">{task.title}</span>
    </div>
  );
}
