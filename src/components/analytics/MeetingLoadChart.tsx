"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import type { DailyMeetingLoad } from "@/types/analytics";

interface Props {
  data: DailyMeetingLoad[];
}

export function MeetingLoadChart({ data }: Props) {
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
          formatter={(value: unknown, name: unknown) =>
            name === "count" ? [Number(value), "Events"] : [`${Number(value)}m`, "Duration"]
          }
        />
        <Bar dataKey="count" fill="#ec4899" radius={[3, 3, 0, 0]} name="count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
