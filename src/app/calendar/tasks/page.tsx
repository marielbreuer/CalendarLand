"use client";

import { useMemo, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useCalendars } from "@/hooks/useCalendars";
import { TaskList } from "@/components/tasks/TaskList";
import { useUIStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import type { TaskStatus } from "@/types/task";

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const { data: calendars } = useCalendars();
  const openCreateTaskModal = useUIStore((s) => s.openCreateTaskModal);

  const visibleCalendarIds = useMemo(
    () => (calendars ?? []).filter((c) => c.isVisible).map((c) => c.id),
    [calendars]
  );

  const calendarColors = useMemo(() => {
    const map: Record<string, string> = {};
    calendars?.forEach((c) => {
      map[c.id] = c.color;
    });
    return map;
  }, [calendars]);

  const { data, isLoading } = useTasks({
    status: statusFilter || undefined,
    calendarIds: visibleCalendarIds.length > 0 ? visibleCalendarIds : undefined,
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>Tasks</h2>
        <div className="flex items-center gap-1 ml-4 bg-[var(--bg-secondary)] rounded-lg p-0.5">
          {[
            { label: "All", value: "" },
            { label: "To Do", value: "todo" },
            { label: "Doing", value: "doing" },
            { label: "Done", value: "done" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value as TaskStatus | "")}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                statusFilter === opt.value
                  ? "bg-white shadow-sm font-medium text-[var(--pink-deep)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={openCreateTaskModal}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <TaskList tasks={tasks} calendarColors={calendarColors} isLoading={isLoading} />
      </div>

    </div>
  );
}
