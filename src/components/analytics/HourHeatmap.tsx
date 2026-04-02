"use client";

import type { HourHeatmapCell } from "@/types/analytics";

interface Props {
  data: HourHeatmapCell[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12a";
  if (i < 12) return `${i}a`;
  if (i === 12) return "12p";
  return `${i - 12}p`;
});

export function HourHeatmap({ data }: Props) {
  const maxCount = Math.max(...data.map((c) => c.count), 1);
  const cellMap = new Map(data.map((c) => [`${c.dayOfWeek}:${c.hour}`, c.count]));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Hour labels */}
        <div className="flex ml-9 mb-1">
          {HOUR_LABELS.map((label, h) => (
            <div
              key={h}
              className="flex-1 text-[9px] text-[var(--text-tertiary)] text-center"
              style={{ minWidth: 0 }}
            >
              {h % 3 === 0 ? label : ""}
            </div>
          ))}
        </div>
        {/* Grid */}
        {DAY_LABELS.map((day, d) => (
          <div key={d} className="flex items-center gap-1 mb-0.5">
            <div className="w-8 text-[10px] text-[var(--text-secondary)] text-right flex-shrink-0">
              {day}
            </div>
            <div className="flex flex-1 gap-0.5">
              {Array.from({ length: 24 }, (_, h) => {
                const count = cellMap.get(`${d}:${h}`) ?? 0;
                const opacity = count === 0 ? 0.05 : 0.15 + (count / maxCount) * 0.85;
                return (
                  <div
                    key={h}
                    title={count > 0 ? `${day} ${HOUR_LABELS[h]}: ${count} event${count !== 1 ? "s" : ""}` : undefined}
                    className="flex-1 rounded-sm"
                    style={{
                      aspectRatio: "1 / 1",
                      backgroundColor: `rgba(236, 72, 153, ${opacity})`,
                      minWidth: 0,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-2 ml-9">
          <span className="text-[10px] text-[var(--text-tertiary)]">Less</span>
          {[0.05, 0.25, 0.5, 0.75, 1].map((op) => (
            <div
              key={op}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: `rgba(236, 72, 153, ${op})` }}
            />
          ))}
          <span className="text-[10px] text-[var(--text-tertiary)]">More</span>
        </div>
      </div>
    </div>
  );
}
