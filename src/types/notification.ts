export interface Reminder {
  minutes: number;
}

export type NotificationType = "event_reminder" | "task_deadline" | "daily_briefing";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  eventId: string | null;
  taskId: string | null;
  fireAt: string;
  fired: boolean;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const REMINDER_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 0, label: "At time of event" },
  { minutes: 5, label: "5 minutes before" },
  { minutes: 15, label: "15 minutes before" },
  { minutes: 30, label: "30 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 120, label: "2 hours before" },
  { minutes: 1440, label: "1 day before" },
];
