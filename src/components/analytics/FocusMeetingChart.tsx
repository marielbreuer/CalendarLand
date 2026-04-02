"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { formatDuration } from "@/lib/analytics";
import type { FocusMeetingDay } from "@/types/analytics";

interface Props {
  data: FocusMeetingDay[];
}

export function FocusMeetingChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-[var(--text-tertiary)]">
        No events in this period
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "MMM d"),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: unknown) => [formatDuration(Number(value)), ""]}
        />
        <Legend />
        <Bar dataKey="focusMinutes" stackId="a" fill="#8b5cf6" name="Focus" radius={[0, 0, 0, 0]} />
        <Bar dataKey="meetingMinutes" stackId="a" fill="#ec4899" name="Meetings" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
