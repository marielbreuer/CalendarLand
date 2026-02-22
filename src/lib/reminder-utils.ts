import type { Reminder } from "@/types/notification";

export function parseReminders(json: string | null): Reminder[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export function serializeReminders(reminders?: Reminder[]): string | null {
  if (!reminders || reminders.length === 0) return null;
  return JSON.stringify(reminders);
}

export function reminderLabel(minutes: number): string {
  if (minutes === 0) return "At time of event";
  if (minutes < 60) return `${minutes} min before`;
  if (minutes === 60) return "1 hour before";
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hours before`;
    return `${hours}h ${mins}m before`;
  }
  if (minutes === 1440) return "1 day before";
  const days = Math.floor(minutes / 1440);
  return `${days} days before`;
}

export function computeFireTimes(
  eventStart: Date,
  reminders: Reminder[]
): { minutes: number; fireAt: Date }[] {
  return reminders.map((r) => ({
    minutes: r.minutes,
    fireAt: new Date(eventStart.getTime() - r.minutes * 60 * 1000),
  }));
}
