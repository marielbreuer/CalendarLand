"use client";

import { addDays, startOfWeek, isSameDay, isToday, format } from "date-fns";
import { useCalendarViewStore } from "@/stores/calendarViewStore";

export function MobileWeekStrip() {
  const { selectedDate, setSelectedDate } = useCalendarViewStore();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div
      className="flex items-center overflow-x-auto no-scrollbar px-2 py-2 gap-1 border-b border-[var(--border-primary)] flex-shrink-0"
      style={{ background: "var(--bg-primary)" }}
    >
      {days.map((day) => {
        const selected = isSameDay(day, selectedDate);
        const today = isToday(day);
        return (
          <button
            key={day.toISOString()}
            onClick={() => setSelectedDate(day)}
            className={`flex flex-col items-center flex-shrink-0 w-10 py-1.5 rounded-xl transition-all ${
              selected
                ? "text-white"
                : today
                ? "text-[var(--pink-deep)]"
                : "text-[var(--text-secondary)]"
            }`}
            style={selected ? { background: "var(--pink)" } : {}}
          >
            <span className="text-[10px] font-medium uppercase">{format(day, "EEE")}</span>
            <span className={`text-sm font-bold ${today && !selected ? "text-[var(--pink-deep)]" : ""}`}>
              {format(day, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
