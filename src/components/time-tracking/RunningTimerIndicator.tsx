"use client";

import { useEffect } from "react";
import { useTimerStore } from "@/stores/timerStore";
import { useStopTimer, useRunningTimer } from "@/hooks/useTimeEntries";
import { toast } from "sonner";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RunningTimerIndicator() {
  // Hydrate from server on mount
  useRunningTimer();

  const runningEntryId = useTimerStore((s) => s.runningEntryId);
  const runningLabel = useTimerStore((s) => s.runningLabel);
  const elapsedSeconds = useTimerStore((s) => s.elapsedSeconds);
  const tickTimer = useTimerStore((s) => s.tickTimer);
  const stopTimer = useStopTimer();

  // Tick every second while running
  useEffect(() => {
    if (!runningEntryId) return;
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [runningEntryId, tickTimer]);

  if (!runningEntryId) return null;

  function handleStop() {
    if (!runningEntryId) return;
    stopTimer.mutate(
      { entryId: runningEntryId, endedAt: new Date().toISOString() },
      {
        onSuccess: () => toast.success("Timer stopped"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs flex-shrink-0">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
      <span className="font-mono font-medium">{formatElapsed(elapsedSeconds)}</span>
      {runningLabel && (
        <span className="max-w-[100px] truncate hidden sm:inline text-green-600">
          {runningLabel}
        </span>
      )}
      <button
        onClick={handleStop}
        disabled={stopTimer.isPending}
        className="ml-1 text-green-600 hover:text-red-600 transition-colors disabled:opacity-50"
        title="Stop timer"
      >
        <span className="w-3 h-3 rounded-sm bg-current block" />
      </button>
    </div>
  );
}
