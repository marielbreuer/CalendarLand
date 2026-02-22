"use client";

import { formatTime24 } from "@/lib/dates";

const HOUR_HEIGHT = 60;

export function TimeGutter() {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative w-16 flex-shrink-0 border-r border-[var(--border-primary)]">
      {hours.map((hour) => (
        <div
          key={hour}
          className="relative text-[11px] text-[var(--text-tertiary)] text-right pr-2"
          style={{ height: HOUR_HEIGHT }}
        >
          {hour > 0 && (
            <span className="absolute -top-[7px] right-2">
              {formatTime24(hour)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export { HOUR_HEIGHT };
