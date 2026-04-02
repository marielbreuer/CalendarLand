"use client";

import { format } from "date-fns";
import { formatDuration } from "@/lib/analytics";
import type { TimeEntryWithCalendar } from "@/types/timeEntry";

interface Props {
  entries: TimeEntryWithCalendar[];
  rangeStart: string;
  rangeEnd: string;
}

export function TimesheetTable({ entries, rangeStart, rangeEnd }: Props) {
  if (!entries.length) {
    return (
      <p className="text-sm text-[var(--text-tertiary)] text-center py-6">
        No time entries in this period
      </p>
    );
  }

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);
  const billableMinutes = entries
    .filter((e) => e.isBillable)
    .reduce((sum, e) => sum + (e.duration ?? 0), 0);

  function handleExport() {
    const params = new URLSearchParams({ start: rangeStart, end: rangeEnd });
    window.open(`/api/time-entries/export?${params}`, "_blank");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>
            Total: <span className="font-medium text-[var(--text-primary)]">{formatDuration(totalMinutes)}</span>
          </span>
          <span>
            Billable: <span className="font-medium text-green-600">{formatDuration(billableMinutes)}</span>
          </span>
          <span>
            Non-billable: <span className="font-medium text-[var(--text-primary)]">{formatDuration(totalMinutes - billableMinutes)}</span>
          </span>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7M3 5l3 3 3-3M2 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Date</th>
              <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Calendar</th>
              <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Description</th>
              <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Start</th>
              <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">End</th>
              <th className="text-right px-3 py-2 font-medium text-[var(--text-secondary)]">Duration</th>
              <th className="text-center px-3 py-2 font-medium text-[var(--text-secondary)]">Billable</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <td className="px-3 py-2 text-[var(--text-secondary)]">
                  {format(new Date(entry.startedAt), "MMM d")}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.calendar.color }}
                    />
                    {entry.calendar.name}
                  </div>
                </td>
                <td className="px-3 py-2 text-[var(--text-secondary)] max-w-[180px] truncate">
                  {entry.description ?? "—"}
                </td>
                <td className="px-3 py-2 text-[var(--text-secondary)]">
                  {format(new Date(entry.startedAt), "HH:mm")}
                </td>
                <td className="px-3 py-2 text-[var(--text-secondary)]">
                  {entry.endedAt ? format(new Date(entry.endedAt), "HH:mm") : "—"}
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  {entry.duration != null ? formatDuration(entry.duration) : "—"}
                </td>
                <td className="px-3 py-2 text-center">
                  {entry.isBillable ? (
                    <span className="text-green-600 font-medium">✓</span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
