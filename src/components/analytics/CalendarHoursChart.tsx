"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatDuration } from "@/lib/analytics";
import type { CalendarHourStat } from "@/types/analytics";

interface Props {
  data: CalendarHourStat[];
}

export function CalendarHoursChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-[var(--text-tertiary)]">
        No tracked time in this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="totalMinutes"
          nameKey="calendarName"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.calendarId} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: unknown) => [formatDuration(Number(value)), "Tracked"]}
        />
        <Legend
          formatter={(value, entry) => {
            const stat = data.find((d) => d.calendarName === value);
            return stat ? `${value} (${formatDuration(stat.totalMinutes)})` : value;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
