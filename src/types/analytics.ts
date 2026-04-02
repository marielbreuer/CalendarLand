export type AnalyticsRange =
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface CalendarHourStat {
  calendarId: string;
  calendarName: string;
  color: string;
  totalMinutes: number;
}

export interface DailyMeetingLoad {
  date: string; // "YYYY-MM-DD"
  count: number;
  totalMinutes: number;
}

export interface FocusMeetingDay {
  date: string;
  focusMinutes: number;
  meetingMinutes: number;
}

export interface TaskCompletionPoint {
  date: string;
  completed: number;
  cumulative: number;
}

export interface HourHeatmapCell {
  dayOfWeek: number; // 0=Mon..6=Sun
  hour: number; // 0..23
  count: number;
}

export interface AnalyticsData {
  calendarHours: CalendarHourStat[];
  dailyMeetingLoad: DailyMeetingLoad[];
  focusMeeting: FocusMeetingDay[];
  taskCompletion: TaskCompletionPoint[];
  heatmap: HourHeatmapCell[];
  totalTrackedMinutes: number;
  billableMinutes: number;
  dateRange: { start: string; end: string };
}
