"use client";

import { useState } from "react";
import { TaskItem } from "./TaskItem";
import type { Task, TaskStatus } from "@/types/task";

interface TaskListProps {
  tasks: Task[];
  calendarColors: Record<string, string>;
  isLoading?: boolean;
}

const statusGroups: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "doing", label: "In Progress" },
  { status: "done", label: "Done" },
];

export function TaskList({ tasks, calendarColors, isLoading }: TaskListProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]">
            <div className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-[var(--bg-tertiary)]" />
              <div className="h-3 w-1/3 rounded bg-[var(--bg-tertiary)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-3 opacity-40">
          <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
          <path d="M16 18h16M16 26h12M16 34h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-medium">No tasks yet</p>
        <p className="text-xs mt-1">Create a task to get started</p>
      </div>
    );
  }

  const grouped = statusGroups.map((g) => ({
    ...g,
    tasks: tasks.filter((t) => t.status === g.status),
  }));

  return (
    <div className="divide-y divide-[var(--border-primary)]">
      {grouped.map((group) => {
        if (group.tasks.length === 0) return null;
        const isCollapsed = collapsed[group.status];

        return (
          <div key={group.status} className="py-2">
            <button
              onClick={() => setCollapsed((s) => ({ ...s, [group.status]: !s[group.status] }))}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
              >
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {group.label}
              </span>
              <span className="text-xs text-[var(--text-tertiary)] ml-1">
                ({group.tasks.length})
              </span>
            </button>
            {!isCollapsed && (
              <div className="mt-1 space-y-0.5">
                {group.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    calendarColor={calendarColors[task.calendarId]}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
