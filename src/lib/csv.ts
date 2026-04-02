import { format } from "date-fns";
import type { TimeEntryWithCalendar } from "@/types/timeEntry";

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildTimesheetCsv(entries: TimeEntryWithCalendar[]): string {
  const header = "Date,Calendar,Description,Start,End,Duration (min),Billable";
  const rows = entries.map((e) => {
    const date = format(new Date(e.startedAt), "yyyy-MM-dd");
    const start = format(new Date(e.startedAt), "yyyy-MM-dd HH:mm");
    const end = e.endedAt ? format(new Date(e.endedAt), "yyyy-MM-dd HH:mm") : "";
    return [
      escapeCsv(date),
      escapeCsv(e.calendar.name),
      escapeCsv(e.description),
      escapeCsv(start),
      escapeCsv(end),
      e.duration ?? "",
      e.isBillable ? "Yes" : "No",
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
