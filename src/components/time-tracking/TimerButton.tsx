"use client";

import { useTimerStore } from "@/stores/timerStore";
import { useStartTimer, useStopTimer } from "@/hooks/useTimeEntries";
import { toast } from "sonner";

interface TimerButtonProps {
  entityType: "event" | "task";
  entityId: string;
  entityTitle: string;
  calendarId: string;
  eventEndTime?: Date;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TimerButton({ entityType, entityId, entityTitle, calendarId, eventEndTime }: TimerButtonProps) {
  const runningEntryId = useTimerStore((s) => s.runningEntryId);
  const runningLabel = useTimerStore((s) => s.runningLabel);
  const elapsedSeconds = useTimerStore((s) => s.elapsedSeconds);
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const isRunningForThis =
    runningEntryId !== null && runningLabel === entityTitle;

  function handleStart(e: React.MouseEvent) {
    e.stopPropagation();
    if (runningEntryId) {
      toast.error("Stop the current timer before starting a new one");
      return;
    }
    startTimer.mutate(
      {
        label: entityTitle,
        calendarId,
        startedAt: new Date().toISOString(),
        description: entityTitle,
        ...(entityType === "event" ? { eventId: entityId } : { taskId: entityId }),
        eventEndTime,
      },
      {
        onSuccess: () => toast.success("Timer started"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleStop(e: React.MouseEvent) {
    e.stopPropagation();
    if (!runningEntryId) return;
    stopTimer.mutate(
      { entryId: runningEntryId, endedAt: new Date().toISOString() },
      {
        onSuccess: () => toast.success("Timer stopped"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  if (isRunningForThis) {
    return (
      <button
        onClick={handleStop}
        disabled={stopTimer.isPending}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
      >
        <span className="w-2 h-2 rounded-sm bg-red-500 flex-shrink-0" />
        Stop · {formatElapsed(elapsedSeconds)}
      </button>
    );
  }

  return (
    <button
      onClick={handleStart}
      disabled={startTimer.isPending}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-green-100 hover:text-green-700 disabled:opacity-50"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <polygon points="2,1 9,5 2,9" />
      </svg>
      Track Time
    </button>
  );
}
