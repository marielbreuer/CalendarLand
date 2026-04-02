"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useCalendars } from "@/hooks/useCalendars";
import { MobileTaskItem } from "./MobileTaskItem";
import type { TaskStatus } from "@/types/task";

const filterTabs: { label: string; value: TaskStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "To Do", value: "todo" },
  { label: "Doing", value: "doing" },
  { label: "Done", value: "done" },
];

export function MobileTasksPage() {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const { data: tasksData, isLoading } = useTasks(
    filter !== "all" ? { status: filter } : {}
  );
  const { data: calendars } = useCalendars();

  const tasks = tasksData?.tasks ?? [];
  const calendarColorMap = Object.fromEntries(
    (calendars ?? []).map((c) => [c.id, c.color])
  );

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border-primary)] overflow-x-auto no-scrollbar flex-shrink-0">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
              filter === tab.value
                ? "text-white"
                : "text-[var(--text-secondary)] bg-[var(--bg-tertiary)]"
            }`}
            style={filter === tab.value ? { background: "var(--pink)" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-[var(--bg-tertiary)] animate-pulse mx-4 my-2 rounded-lg" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)]">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-sm">No tasks{filter !== "all" ? ` with status "${filter}"` : ""}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <MobileTaskItem
              key={task.id}
              task={task}
              calendarColor={calendarColorMap[task.calendarId]}
            />
          ))
        )}
      </div>
    </div>
  );
}
