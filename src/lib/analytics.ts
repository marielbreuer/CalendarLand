import { format, startOfDay, differenceInMinutes, getDay, getHours, eachDayOfInterval } from "date-fns";
import type {
  CalendarHourStat,
  DailyMeetingLoad,
  FocusMeetingDay,
  TaskCompletionPoint,
  HourHeatmapCell,
} from "@/types/analytics";

export function buildCalendarHours(
  entries: { calendarId: string; duration: number | null }[],
  calendars: { id: string; name: string; color: string }[]
): CalendarHourStat[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.duration == null) continue;
    map.set(e.calendarId, (map.get(e.calendarId) ?? 0) + e.duration);
  }
  const results: CalendarHourStat[] = [];
  for (const [calendarId, totalMinutes] of map.entries()) {
    const cal = calendars.find((c) => c.id === calendarId);
    if (!cal) continue;
    results.push({ calendarId, calendarName: cal.name, color: cal.color, totalMinutes });
  }
  return results.sort((a, b) => b.totalMinutes - a.totalMinutes);
}

export function buildDailyMeetingLoad(
  events: { startTime: Date; endTime: Date; isFocusTime: boolean }[]
): DailyMeetingLoad[] {
  const map = new Map<string, { count: number; totalMinutes: number }>();
  for (const e of events) {
    if (e.isFocusTime) continue;
    const key = format(e.startTime, "yyyy-MM-dd");
    const existing = map.get(key) ?? { count: 0, totalMinutes: 0 };
    existing.count++;
    existing.totalMinutes += differenceInMinutes(e.endTime, e.startTime);
    map.set(key, existing);
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildFocusMeeting(
  events: { startTime: Date; endTime: Date; isFocusTime: boolean }[]
): FocusMeetingDay[] {
  const map = new Map<string, { focusMinutes: number; meetingMinutes: number }>();
  for (const e of events) {
    const key = format(e.startTime, "yyyy-MM-dd");
    const existing = map.get(key) ?? { focusMinutes: 0, meetingMinutes: 0 };
    const mins = differenceInMinutes(e.endTime, e.startTime);
    if (e.isFocusTime) {
      existing.focusMinutes += mins;
    } else {
      existing.meetingMinutes += mins;
    }
    map.set(key, existing);
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildTaskCompletion(
  tasks: { updatedAt: Date }[],
  start: Date,
  end: Date
): TaskCompletionPoint[] {
  // Build a map of date -> count completed that day
  const countMap = new Map<string, number>();
  for (const t of tasks) {
    const key = format(startOfDay(t.updatedAt), "yyyy-MM-dd");
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }
  // Produce one point per day in range with cumulative total
  const days = eachDayOfInterval({ start, end });
  let cumulative = 0;
  return days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const completed = countMap.get(key) ?? 0;
    cumulative += completed;
    return { date: key, completed, cumulative };
  });
}

export function buildHeatmap(
  events: { startTime: Date }[]
): HourHeatmapCell[] {
  // 7 days × 24 hours grid; dayOfWeek: 0=Mon..6=Sun
  const grid = new Map<string, number>();
  for (const e of events) {
    const jsDay = getDay(e.startTime); // 0=Sun..6=Sat
    const monDay = jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0..Sun=6
    const hour = getHours(e.startTime);
    const key = `${monDay}:${hour}`;
    grid.set(key, (grid.get(key) ?? 0) + 1);
  }
  const cells: HourHeatmapCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const count = grid.get(`${d}:${h}`) ?? 0;
      cells.push({ dayOfWeek: d, hour: h, count });
    }
  }
  return cells;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
