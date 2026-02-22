import type { Reminder } from "./notification";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  meetingLink: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  timezone: string;
  isRecurring: boolean;
  rrule: string | null;
  recurrenceEnd: string | null;
  seriesId: string | null;
  isException: boolean;
  originalDate: string | null;
  tags: string[];
  reminders: Reminder[];
  isFocusTime: boolean;
  calendarId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  eventId: string;
}

export interface EventOccurrence extends Event {
  occurrenceDate: string;
  isVirtual: boolean;
  masterEventId: string | null;
}

export type RecurrenceScope = "single" | "future" | "all";

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  meetingLink?: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  timezone?: string;
  isRecurring?: boolean;
  rrule?: string;
  recurrenceEnd?: string;
  calendarId: string;
  participants?: { name: string; email: string }[];
  tags?: string[];
  reminders?: Reminder[];
  isFocusTime?: boolean;
}

export interface UpdateEventInput {
  title?: string;
  description?: string | null;
  location?: string | null;
  meetingLink?: string | null;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  timezone?: string;
  isRecurring?: boolean;
  rrule?: string | null;
  recurrenceEnd?: string | null;
  calendarId?: string;
  participants?: { name: string; email: string }[];
  tags?: string[];
  reminders?: Reminder[];
  isFocusTime?: boolean;
  scope?: RecurrenceScope;
  occurrenceDate?: string;
}
