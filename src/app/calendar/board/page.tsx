"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useCalendars } from "@/hooks/useCalendars";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { useUIStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

export default function BoardPage() {
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
    calendarIds: visibleCalendarIds.length > 0 ? visibleCalendarIds : undefined,
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>Board</h2>
        <div className="ml-auto">
          <Button size="sm" onClick={openCreateTaskModal}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard tasks={tasks} calendarColors={calendarColors} isLoading={isLoading} />
      </div>

    </div>
  );
}
