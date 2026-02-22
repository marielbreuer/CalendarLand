"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CalendarList } from "./CalendarList";
import { CalendarCreateModal } from "./CalendarCreateModal";
import { MiniCalendar } from "./MiniCalendar";
import { SidebarTasks } from "./SidebarTasks";
import { useUIStore } from "@/stores/uiStore";

export function Sidebar() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[var(--border-primary)] flex flex-col h-full overflow-y-auto" style={{ background: 'var(--grad-sidebar)' }}>
      <div className="p-4 space-y-2">
        <Button
          onClick={() =>
            useUIStore.getState().openCreateEventModal()
          }
          className="w-full"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="mr-2"
          >
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          New Event
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            useUIStore.getState().openCreateTaskModal()
          }
          className="w-full"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="mr-2"
          >
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          New Task
        </Button>
      </div>

      <div className="mb-4">
        <MiniCalendar />
      </div>

      <SidebarTasks />

      <div className="flex-1 px-2">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-xs font-semibold uppercase text-[var(--text-tertiary)] tracking-wider">
            Calendars
          </h3>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 2v10M2 7h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <CalendarList />
      </div>

      <CalendarCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </aside>
  );
}
