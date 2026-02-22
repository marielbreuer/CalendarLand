"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { useUIStore } from "@/stores/uiStore";
import type { Task, TaskStatus } from "@/types/task";

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  calendarColors: Record<string, string>;
}

const statusEmoji: Record<TaskStatus, string> = {
  todo: "",
  doing: "",
  done: "",
};

export function KanbanColumn({ status, label, tasks, calendarColors }: KanbanColumnProps) {
  const openCreateTaskModal = useUIStore((s) => s.openCreateTaskModal);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: "kanban-column", status },
  });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col max-h-full">
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{statusEmoji[status]}</span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{label}</h3>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={openCreateTaskModal}
          className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-2 p-2 rounded-xl transition-colors min-h-[200px] ${
          isOver ? "bg-[var(--accent)]/5 ring-2 ring-[var(--accent)]/20 ring-inset" : "bg-[var(--bg-secondary)]/50"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              calendarColor={calendarColors[task.calendarId]}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-[var(--text-tertiary)]">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
