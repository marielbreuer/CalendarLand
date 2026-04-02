"use client";

import type { AnalyticsRange } from "@/types/analytics";

interface DateRangePickerProps {
  range: AnalyticsRange;
  customStart: string;
  customEnd: string;
  onChange: (range: AnalyticsRange, customStart?: string, customEnd?: string) => void;
}

const PRESETS: { label: string; value: AnalyticsRange }[] = [
  { label: "This Week", value: "this_week" },
  { label: "Last Week", value: "last_week" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "Custom", value: "custom" },
];

export function DateRangePicker({ range, customStart, customEnd, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center bg-white/50 rounded-lg p-0.5 backdrop-blur-sm">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => onChange(p.value, customStart, customEnd)}
            className={`px-3 py-1 text-xs rounded-md transition-all ${
              range === p.value
                ? "bg-white shadow-sm font-medium text-[var(--pink-deep)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {range === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onChange("custom", e.target.value, customEnd)}
            className="px-2 py-1 text-xs rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] focus:outline-none"
          />
          <span className="text-xs text-[var(--text-secondary)]">–</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onChange("custom", customStart, e.target.value)}
            className="px-2 py-1 text-xs rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
