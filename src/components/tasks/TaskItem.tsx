"use client";

import { useUpdateTask } from "@/hooks/useTasks";
import { useUIStore } from "@/stores/uiStore";
import { format } from "date-fns";
import type { Task, TaskPriority } from "@/types/task";

interface TaskItemProps {
  task: Task;
  calendarColor?: string;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "text-red-600", bg: "bg-red-100" },
  high: { label: "High", color: "text-orange-600", bg: "bg-orange-100" },
  normal: { label: "Normal", color: "text-blue-600", bg: "bg-blue-100" },
  low: { label: "Low", color: "text-gray-500", bg: "bg-gray-100" },
};

export function TaskItem({ task, calendarColor = "#3b82f6" }: TaskItemProps) {
  const updateTask = useUpdateTask();
  const openEditTaskModal = useUIStore((s) => s.openEditTaskModal);

  function handleToggleDone() {
    updateTask.mutate({
      id: task.id,
      data: { status: task.status === "done" ? "todo" : "done" },
    });
  }

  const pConfig = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group cursor-pointer"
      onClick={() => openEditTaskModal(task.id)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggleDone();
        }}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.status === "done"
            ? "border-green-500 bg-green-500"
            : "border-[var(--border-primary)] hover:border-[var(--accent)]"
        }`}
      >
        {task.status === "done" && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 6l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div
        className="w-1 h-8 rounded-full flex-shrink-0"
        style={{ backgroundColor: calendarColor }}
      />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-[var(--text-tertiary)]" : ""}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-[var(--text-tertiary)]"}`}>
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          {task.tags.length > 0 && (
            <div className="flex gap-1">
              {task.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                  {tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${pConfig.color} ${pConfig.bg}`}>
        {pConfig.label}
      </span>
    </div>
  );
}
