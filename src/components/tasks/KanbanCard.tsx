"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUIStore } from "@/stores/uiStore";
import { format } from "date-fns";
import type { Task, TaskPriority } from "@/types/task";

interface KanbanCardProps {
  task: Task;
  calendarColor?: string;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "text-red-600", bg: "bg-red-100" },
  high: { label: "High", color: "text-orange-600", bg: "bg-orange-100" },
  normal: { label: "Normal", color: "text-blue-600", bg: "bg-blue-100" },
  low: { label: "Low", color: "text-gray-500", bg: "bg-gray-100" },
};

export function KanbanCard({ task, calendarColor = "#3b82f6" }: KanbanCardProps) {
  const openEditTaskModal = useUIStore((s) => s.openEditTaskModal);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "kanban-card", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pConfig = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => openEditTaskModal(task.id)}
      className={`glass-card rounded-xl p-3 shadow-sm border border-[var(--border-primary)] cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-1 h-full min-h-[2rem] rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: calendarColor }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${pConfig.color} ${pConfig.bg}`}>
              {pConfig.label}
            </span>
            {task.dueDate && (
              <span className={`text-[10px] ${isOverdue ? "text-red-500 font-medium" : "text-[var(--text-tertiary)]"}`}>
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
          </div>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
