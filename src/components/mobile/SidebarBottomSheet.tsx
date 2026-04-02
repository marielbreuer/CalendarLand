"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { CalendarList } from "@/components/sidebar/CalendarList";
import { MiniCalendar } from "@/components/sidebar/MiniCalendar";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/stores/uiStore";
import Link from "next/link";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SidebarBottomSheet({ open, onClose }: Props) {
  const openCreateEventModal = useUIStore((s) => s.openCreateEventModal);
  const openCreateTaskModal = useUIStore((s) => s.openCreateTaskModal);

  return (
    <BottomSheet open={open} onClose={onClose} title="Menu">
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => { openCreateEventModal(); onClose(); }}
            className="flex-1 text-sm"
          >
            + Event
          </Button>
          <Button
            variant="secondary"
            onClick={() => { openCreateTaskModal(); onClose(); }}
            className="flex-1 text-sm"
          >
            + Task
          </Button>
        </div>

        <MiniCalendar />
        <CalendarList />

        <div className="border-t border-[var(--border-primary)] pt-3 space-y-1">
          <Link
            href="/calendar/scheduling"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            🔗 Scheduling
          </Link>
          <Link
            href="/calendar/analytics"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            📊 Analytics
          </Link>
          <Link
            href="/calendar/settings"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>
    </BottomSheet>
  );
}
