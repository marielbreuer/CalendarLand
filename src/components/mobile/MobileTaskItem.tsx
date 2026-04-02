"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useUIStore } from "@/stores/uiStore";
import { ConfettiBurst } from "@/components/gamification/ConfettiBurst";
import type { Task } from "@/types/task";

const priorityColors: Record<string, string> = {
  urgent: "#dc2626",
  high: "#ea580c",
  normal: "#3b82f6",
  low: "#9ca3af",
};

const difficultyColors: Record<string, string> = {
  easy: "#22c55e",
  medium: "#f59e0b",
  hard: "#ef4444",
};

interface Props {
  task: Task;
  calendarColor?: string;
}

export function MobileTaskItem({ task, calendarColor = "#3b82f6" }: Props) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const openEditTaskModal = useUIStore((s) => s.openEditTaskModal);
  const queryClient = useQueryClient();
  const [showConfetti, setShowConfetti] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTask.mutate(
      { id: task.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["users", "me"] });
          if (newStatus === "done" && task.difficulty === "hard") {
            setShowConfetti(true);
          }
        },
      }
    );
  }

  function onTouchStart(e: React.TouchEvent) {
    swipeStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (swipeStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (delta > 70) {
      // Swipe right → complete
      if (task.status !== "done") {
        updateTask.mutate(
          { id: task.id, data: { status: "done" } },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["users", "me"] });
              if (task.difficulty === "hard") setShowConfetti(true);
            },
          }
        );
      }
    } else if (delta < -70) {
      // Swipe left → delete
      if (confirm(`Delete "${task.title}"?`)) {
        deleteTask.mutate(task.id);
      }
    }
  }

  return (
    <div
      ref={itemRef}
      className="relative flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)] active:bg-[var(--bg-tertiary)] transition-colors"
      onClick={() => openEditTaskModal(task.id)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <ConfettiBurst active={showConfetti} onDone={() => setShowConfetti(false)} />

      {/* Check button */}
      <button
        onClick={handleToggle}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
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

      {/* Calendar color bar */}
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: calendarColor }} />

      {/* Content */}
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
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {task.difficulty && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium text-white"
            style={{ backgroundColor: difficultyColors[task.difficulty] ?? "#6b7280" }}
          >
            {task.difficulty}
          </span>
        )}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: priorityColors[task.priority] ?? "#9ca3af" }}
          title={task.priority}
        />
      </div>
    </div>
  );
}
