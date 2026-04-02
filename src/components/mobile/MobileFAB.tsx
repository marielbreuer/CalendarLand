"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useUIStore } from "@/stores/uiStore";

export function MobileFAB() {
  const [open, setOpen] = useState(false);
  const openCreateEventModal = useUIStore((s) => s.openCreateEventModal);
  const openCreateTaskModal = useUIStore((s) => s.openCreateTaskModal);

  function handleEvent() {
    setOpen(false);
    openCreateEventModal();
  }

  function handleTask() {
    setOpen(false);
    openCreateTaskModal();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-transform active:scale-95"
        style={{ background: "var(--pink)", color: "#fff" }}
        aria-label="Create new"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Create New">
        <div className="p-4 space-y-3">
          <button
            onClick={handleEvent}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-left"
          >
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-medium">New Event</p>
              <p className="text-xs text-[var(--text-tertiary)]">Add to your calendar</p>
            </div>
          </button>
          <button
            onClick={handleTask}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-left"
          >
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-medium">New Task</p>
              <p className="text-xs text-[var(--text-tertiary)]">Add to your task list</p>
            </div>
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
