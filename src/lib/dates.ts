import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  differenceInMinutes,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  eachDayOfInterval,
  areIntervalsOverlapping,
} from "date-fns";
import type { CalendarView, DateRange } from "@/types/common";

export function getDayRange(date: Date): DateRange {
  return { start: startOfDay(date), end: endOfDay(date) };
}

export function getWeekRange(date: Date): DateRange {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(date: Date): DateRange {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  return {
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  };
}

export function getViewRange(date: Date, view: CalendarView): DateRange {
  switch (view) {
    case "day":
      return getDayRange(date);
    case "week":
    case "list":
      return getWeekRange(date);
    case "month":
      return getMonthRange(date);
  }
}

export function navigateDate(
  date: Date,
  view: CalendarView,
  direction: "forward" | "backward"
): Date {
  const fn = direction === "forward";
  switch (view) {
    case "day":
      return fn ? addDays(date, 1) : subDays(date, 1);
    case "week":
    case "list":
      return fn ? addWeeks(date, 1) : subWeeks(date, 1);
    case "month":
      return fn ? addMonths(date, 1) : subMonths(date, 1);
  }
}

export function getWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });
}

export function getMonthDays(date: Date): Date[] {
  const range = getMonthRange(date);
  return eachDayOfInterval({ start: range.start, end: range.end });
}

export function formatHeaderDate(date: Date, view: CalendarView): string {
  switch (view) {
    case "day":
      return format(date, "EEEE, MMMM d, yyyy");
    case "week":
    case "list": {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, "MMM d")} – ${format(weekEnd, "d, yyyy")}`;
      }
      return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
    }
    case "month":
      return format(date, "MMMM yyyy");
  }
}

export function getTimeFromPixelY(
  pixelY: number,
  gridHeight: number,
  snapMinutes: number = 15
): { hour: number; minute: number } {
  const totalMinutes = (pixelY / gridHeight) * 24 * 60;
  const snapped =
    Math.round(totalMinutes / snapMinutes) * snapMinutes;
  const clamped = Math.max(0, Math.min(snapped, 24 * 60 - 1));
  return {
    hour: Math.floor(clamped / 60),
    minute: clamped % 60,
  };
}

export function getPixelYFromTime(
  hour: number,
  minute: number,
  gridHeight: number
): number {
  return ((hour * 60 + minute) / (24 * 60)) * gridHeight;
}

export function getEventDurationMinutes(
  startTime: Date,
  endTime: Date
): number {
  return differenceInMinutes(endTime, startTime);
}

export function formatTimeSlot(date: Date): string {
  return format(date, "h:mm a");
}

export function formatTime24(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function eventsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return areIntervalsOverlapping(
    { start: aStart, end: aEnd },
    { start: bStart, end: bEnd }
  );
}

export {
  isSameDay,
  isSameMonth,
  isToday,
  format,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  addDays,
  startOfDay,
  endOfDay,
  differenceInMinutes,
};
