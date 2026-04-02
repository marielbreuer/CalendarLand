"use client";

import { useState, useEffect } from "react";
import { startOfWeek, format } from "date-fns";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { CalendarHoursChart } from "@/components/analytics/CalendarHoursChart";
import { MeetingLoadChart } from "@/components/analytics/MeetingLoadChart";
import { FocusMeetingChart } from "@/components/analytics/FocusMeetingChart";
import { TaskCompletionChart } from "@/components/analytics/TaskCompletionChart";
import { HourHeatmap } from "@/components/analytics/HourHeatmap";
import { TimesheetTable } from "@/components/analytics/TimesheetTable";
import { WeeklyDigestCard } from "@/components/analytics/WeeklyDigestCard";
import { useAnalytics, useWeeklyDigest, useGenerateWeeklyDigest } from "@/hooks/useAnalytics";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { formatDuration } from "@/lib/analytics";
import { getAnalyticsRange } from "@/lib/dates";
import type { AnalyticsRange } from "@/types/analytics";
import type { TimeEntryWithCalendar } from "@/types/timeEntry";

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-center">
      <p className="text-2xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{label}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="h-4 w-1/3 bg-[var(--bg-tertiary)] rounded animate-pulse mb-4" />
      <div className="h-40 bg-[var(--bg-tertiary)] rounded animate-pulse" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("this_week");
  const [customStart, setCustomStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));

  const { start: rangeStart, end: rangeEnd } = getAnalyticsRange(
    range,
    range === "custom" ? new Date(customStart).toISOString() : undefined,
    range === "custom" ? new Date(customEnd).toISOString() : undefined
  );

  const weekStart = startOfWeek(rangeStart, { weekStartsOn: 1 }).toISOString();

  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics(
    range,
    range === "custom" ? new Date(customStart).toISOString() : undefined,
    range === "custom" ? new Date(customEnd).toISOString() : undefined
  );

  const { data: entriesData, isLoading: entriesLoading } = useTimeEntries({
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString(),
  });

  const { data: digestData, isLoading: digestLoading } = useWeeklyDigest(weekStart);
  const generateDigest = useGenerateWeeklyDigest();

  // Auto-generate digest if stale (>24h old or missing)
  useEffect(() => {
    if (digestLoading || generateDigest.isPending) return;
    const d = digestData?.digest;
    if (!d) {
      generateDigest.mutate(weekStart);
      return;
    }
    const ageMs = Date.now() - new Date(d.generatedAt).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      generateDigest.mutate(weekStart);
    }
  }, [digestData, digestLoading, weekStart]);

  function handleRangeChange(newRange: AnalyticsRange, cs?: string, ce?: string) {
    setRange(newRange);
    if (cs) setCustomStart(cs);
    if (ce) setCustomEnd(ce);
  }

  const analytics = analyticsData?.analytics;
  const entries = (entriesData?.timeEntries ?? []) as TimeEntryWithCalendar[];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] flex-wrap gap-3">
        <h1 className="text-lg font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Analytics
        </h1>
        <DateRangePicker
          range={range}
          customStart={customStart}
          customEnd={customEnd}
          onChange={handleRangeChange}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI row */}
        {analyticsLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] animate-pulse" />
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Hours Tracked" value={formatDuration(analytics.totalTrackedMinutes)} />
            <KpiCard label="Billable Hours" value={formatDuration(analytics.billableMinutes)} />
            <KpiCard
              label="Total Meetings"
              value={String(analytics.dailyMeetingLoad.reduce((s, d) => s + d.count, 0))}
            />
          </div>
        ) : null}

        {/* Charts row 1: Donut + Stacked bar */}
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton />
            <Skeleton />
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="Time by Calendar">
              <CalendarHoursChart data={analytics.calendarHours} />
            </ChartCard>
            <ChartCard title="Focus vs Meetings">
              <FocusMeetingChart data={analytics.focusMeeting} />
            </ChartCard>
          </div>
        ) : null}

        {/* Meeting load */}
        {analyticsLoading ? (
          <Skeleton />
        ) : analytics ? (
          <ChartCard title="Meeting Load">
            <MeetingLoadChart data={analytics.dailyMeetingLoad} />
          </ChartCard>
        ) : null}

        {/* Task completion */}
        {analyticsLoading ? (
          <Skeleton />
        ) : analytics ? (
          <ChartCard title="Task Completion">
            <TaskCompletionChart data={analytics.taskCompletion} />
          </ChartCard>
        ) : null}

        {/* Heatmap */}
        {analyticsLoading ? (
          <Skeleton />
        ) : analytics ? (
          <ChartCard title="Busiest Hours">
            <HourHeatmap data={analytics.heatmap} />
          </ChartCard>
        ) : null}

        {/* Timesheet */}
        <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
          <h3 className="text-sm font-semibold">Timesheet</h3>
          {entriesLoading ? (
            <div className="h-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          ) : (
            <TimesheetTable
              entries={entries}
              rangeStart={rangeStart.toISOString()}
              rangeEnd={rangeEnd.toISOString()}
            />
          )}
        </div>

        {/* Weekly digest */}
        <WeeklyDigestCard
          digest={digestData?.digest ?? null}
          weekStart={weekStart}
          isLoading={digestLoading}
        />
      </div>
    </div>
  );
}
