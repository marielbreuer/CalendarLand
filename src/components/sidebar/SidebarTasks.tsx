"use client";

import Link from "next/link";
import { useTasks } from "@/hooks/useTasks";
import { useCalendars } from "@/hooks/useCalendars";
import { TaskChip } from "@/components/tasks/TaskChip";
import type { TaskPriority } from "@/types/task";

const priorityOrder: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export function SidebarTasks() {
  const { data: calendars } = useCalendars();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const { data } = useTasks({
    dueBefore: today.toISOString(),
  });

  const calendarColors: Record<string, string> = {};
  calendars?.forEach((c) => {
    calendarColors[c.id] = c.color;
  });

  // Filter: not done, due today or no due date
  const tasks = (data?.tasks ?? [])
    .filter((t) => t.status !== "done")
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 8);

  if (tasks.length === 0) return null;

  return (
    <div className="px-2 mb-4">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-xs font-semibold uppercase text-[var(--text-tertiary)] tracking-wider">
          Tasks
        </h3>
        <Link
          href="/calendar/tasks"
          className="text-[10px] text-[var(--accent)] hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="space-y-0.5">
        {tasks.map((task) => (
          <TaskChip
            key={task.id}
            task={task}
            calendarColor={calendarColors[task.calendarId]}
          />
        ))}
      </div>
    </div>
  );
}
