export interface WeeklyDigestData {
  weekStart: string;
  weekEnd: string;
  hoursPerCalendar: { calendarId: string; calendarName: string; minutes: number }[];
  meetingsAttended: number;
  tasksCompleted: number;
  upcomingEvents: { title: string; startTime: string; calendarName: string }[];
}

export interface WeeklyDigest {
  id: string;
  userId: string;
  weekStart: string;
  data: WeeklyDigestData;
  generatedAt: string;
}
