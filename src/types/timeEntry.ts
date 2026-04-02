export interface TimeEntry {
  id: string;
  description: string | null;
  eventId: string | null;
  taskId: string | null;
  calendarId: string;
  userId: string;
  startedAt: string; // ISO string
  endedAt: string | null;
  duration: number | null; // minutes; null = still running
  isBillable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryWithCalendar extends TimeEntry {
  calendar: { id: string; name: string; color: string };
}
