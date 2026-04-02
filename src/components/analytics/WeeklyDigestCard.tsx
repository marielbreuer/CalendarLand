"use client";

import { format } from "date-fns";
import { formatDuration } from "@/lib/analytics";
import { useGenerateWeeklyDigest } from "@/hooks/useAnalytics";
import { toast } from "sonner";
import type { WeeklyDigest } from "@/types/weeklyDigest";

interface Props {
  digest: WeeklyDigest | null;
  weekStart: string;
  isLoading?: boolean;
}

export function WeeklyDigestCard({ digest, weekStart, isLoading }: Props) {
  const generate = useGenerateWeeklyDigest();

  function handleRefresh() {
    generate.mutate(weekStart, {
      onSuccess: () => toast.success("Weekly digest refreshed"),
      onError: (err) => toast.error(err.message),
    });
  }

  const data = digest?.data;
  const totalMinutes = data
    ? data.hoursPerCalendar.reduce((sum, c) => sum + c.minutes, 0)
    : 0;
  const maxMinutes = data
    ? Math.max(...data.hoursPerCalendar.map((c) => c.minutes), 1)
    : 1;

  return (
    <div className="p-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Weekly Digest</h3>
          {data && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {format(new Date(data.weekStart), "MMM d")} – {format(new Date(data.weekEnd), "MMM d, yyyy")}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={generate.isPending || isLoading}
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
        >
          {generate.isPending ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-[var(--bg-tertiary)] rounded" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-sm text-[var(--text-tertiary)]">
          No digest yet.{" "}
          <button onClick={handleRefresh} className="underline text-[var(--accent)]">
            Generate now
          </button>
        </p>
      ) : (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-center">
              <p className="text-xl font-bold">{formatDuration(totalMinutes)}</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Tracked</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-center">
              <p className="text-xl font-bold">{data.meetingsAttended}</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Meetings</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-center">
              <p className="text-xl font-bold">{data.tasksCompleted}</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Tasks Done</p>
            </div>
          </div>

          {/* Hours per calendar */}
          {data.hoursPerCalendar.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-secondary)]">Time by Calendar</p>
              {data.hoursPerCalendar.map((c) => (
                <div key={c.calendarId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{c.calendarName}</span>
                    <span className="text-[var(--text-secondary)]">{formatDuration(c.minutes)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.minutes / maxMinutes) * 100}%`,
                        backgroundColor: "var(--accent, #ec4899)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming events */}
          {data.upcomingEvents.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--text-secondary)]">Upcoming</p>
              {data.upcomingEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <span className="text-[var(--text-tertiary)] w-16 flex-shrink-0">
                    {format(new Date(e.startTime), "EEE MMM d")}
                  </span>
                  <span className="truncate">{e.title}</span>
                  <span className="text-[var(--text-tertiary)] flex-shrink-0">{e.calendarName}</span>
                </div>
              ))}
            </div>
          )}

          {digest?.generatedAt && (
            <p className="text-[10px] text-[var(--text-tertiary)]">
              Generated {format(new Date(digest.generatedAt), "MMM d 'at' HH:mm")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
