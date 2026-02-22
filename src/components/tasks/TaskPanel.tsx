"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useCalendars } from "@/hooks/useCalendars";
import { useUIStore } from "@/stores/uiStore";
import { TaskItem } from "./TaskItem";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function TaskPanel() {
  const taskPanelOpen = useUIStore((s) => s.taskPanelOpen);
  const toggleTaskPanel = useUIStore((s) => s.toggleTaskPanel);
  const openCreateTaskModal = useUIStore((s) => s.openCreateTaskModal);
  const { data: calendars } = useCalendars();

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
    calendarIds: visibleCalendarIds.length > 0 ? visibleCalendarIds : undefined,
  });

  const tasks = data?.tasks ?? [];
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doingTasks = tasks.filter((t) => t.status === "doing");
  const doneTasks = tasks.filter((t) => t.status === "done");

  if (!taskPanelOpen) return null;

  return (
    <>
      <div className="w-80 flex-shrink-0 border-l border-[var(--border-primary)] flex flex-col h-full bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
          <h3 className="text-sm font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Tasks
          </h3>
          <div className="flex items-center gap-1">
            <Link
              href="/calendar/tasks"
              className="text-[10px] text-[var(--accent)] hover:underline mr-2"
            >
              Full View
            </Link>
            <button
              onClick={toggleTaskPanel}
              className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors text-[var(--text-tertiary)]"
              aria-label="Close task panel"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* New Task button */}
        <div className="px-3 py-2 border-b border-[var(--border-primary)]">
          <Button size="sm" onClick={openCreateTaskModal} className="w-full">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Task
          </Button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="w-4 h-4 rounded-full bg-[var(--bg-tertiary)]" />
                  <div className="flex-1 h-4 rounded bg-[var(--bg-tertiary)]" />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none" className="mb-2 opacity-40">
                <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M16 18h16M16 26h12M16 34h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-xs font-medium">No tasks</p>
            </div>
          ) : (
            <div>
              {/* Doing */}
              {doingTasks.length > 0 && (
                <div className="py-1.5">
                  <div className="px-3 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      In Progress ({doingTasks.length})
                    </span>
                  </div>
                  {doingTasks.map((task) => (
                    <TaskItem key={task.id} task={task} calendarColor={calendarColors[task.calendarId]} />
                  ))}
                </div>
              )}

              {/* To Do */}
              {todoTasks.length > 0 && (
                <div className="py-1.5">
                  <div className="px-3 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      To Do ({todoTasks.length})
                    </span>
                  </div>
                  {todoTasks.map((task) => (
                    <TaskItem key={task.id} task={task} calendarColor={calendarColors[task.calendarId]} />
                  ))}
                </div>
              )}

              {/* Done */}
              {doneTasks.length > 0 && (
                <div className="py-1.5">
                  <div className="px-3 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Done ({doneTasks.length})
                    </span>
                  </div>
                  {doneTasks.map((task) => (
                    <TaskItem key={task.id} task={task} calendarColor={calendarColors[task.calendarId]} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </>
  );
}
