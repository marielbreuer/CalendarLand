export interface SchedulingPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durations: number[];
  bufferMinutes: number;
  daysInAdvance: number;
  timezone: string;
  isActive: boolean;
  calendarId: string | null;
  calendarName?: string;
  calendarColor?: string;
  createdAt: string;
  updatedAt: string;
  bookingCount?: number;
}

export interface Booking {
  id: string;
  schedulingPageId: string;
  eventId: string | null;
  guestName: string;
  guestEmail: string;
  guestMessage: string | null;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  createdAt: string;
}

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
}

export interface CreateSchedulingPageInput {
  title: string;
  slug?: string;
  description?: string;
  durations: number[];
  bufferMinutes?: number;
  daysInAdvance?: number;
  timezone: string;
  isActive?: boolean;
  calendarId?: string | null;
}

export interface UpdateSchedulingPageInput {
  title?: string;
  slug?: string;
  description?: string | null;
  durations?: number[];
  bufferMinutes?: number;
  daysInAdvance?: number;
  timezone?: string;
  isActive?: boolean;
  calendarId?: string | null;
}

export interface BookingInput {
  guestName: string;
  guestEmail: string;
  guestMessage?: string;
  startTime: string;
  duration: number;
  calendarId: string;
}
