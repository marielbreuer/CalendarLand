"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import type { TaskCompletionPoint } from "@/types/analytics";

interface Props {
  data: TaskCompletionPoint[];
}

export function TaskCompletionChart({ data }: Props) {
  const hasData = data.some((d) => d.completed > 0);
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-[var(--text-tertiary)]">
        No completed tasks in this period
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "MMM d"),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke="#ec4899"
          strokeWidth={2}
          dot={false}
          name="Total Completed"
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="#8b5cf6"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="4 2"
          name="Completed That Day"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
