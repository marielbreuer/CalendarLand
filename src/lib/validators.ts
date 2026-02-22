import { z } from "zod";

export const createCalendarSchema = z.object({
  name: z.string().min(1, "Calendar name is required").max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format")
    .default("#ec4899"),
});

export const updateCalendarSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).optional(),
  isAlwaysAvailable: z.boolean().optional(),
});

export const participantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const reminderSchema = z.object({
  minutes: z.number().int().min(0).max(10080), // up to 1 week
});

export const createEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional(),
    location: z.string().max(500).optional(),
    meetingLink: z.string().url().optional().or(z.literal("")),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    isAllDay: z.boolean().default(false),
    timezone: z.string().default("UTC"),
    isRecurring: z.boolean().default(false),
    rrule: z.string().optional(),
    recurrenceEnd: z.string().datetime().optional(),
    calendarId: z.string().min(1),
    participants: z.array(participantSchema).default([]),
    tags: z.array(z.string().max(50)).max(20).optional(),
    reminders: z.array(reminderSchema).max(5).optional(),
    isFocusTime: z.boolean().default(false),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  meetingLink: z.string().url().nullable().optional().or(z.literal("")),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  isAllDay: z.boolean().optional(),
  timezone: z.string().optional(),
  isRecurring: z.boolean().optional(),
  rrule: z.string().nullable().optional(),
  recurrenceEnd: z.string().datetime().nullable().optional(),
  calendarId: z.string().optional(),
  participants: z.array(participantSchema).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  reminders: z.array(reminderSchema).max(5).optional(),
  isFocusTime: z.boolean().optional(),
});

// Notification schemas
const notificationTypeEnum = z.enum(["event_reminder", "task_deadline", "daily_briefing"]);

export const createNotificationSchema = z.object({
  type: notificationTypeEnum,
  title: z.string().min(1).max(200),
  body: z.string().max(5000),
  eventId: z.string().optional(),
  taskId: z.string().optional(),
  fireAt: z.string().datetime(),
});

export const updateNotificationSchema = z.object({
  fired: z.boolean().optional(),
  read: z.boolean().optional(),
  dismissed: z.boolean().optional(),
});

export const batchUpdateNotificationsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  update: updateNotificationSchema,
});

const taskStatusEnum = z.enum(["todo", "doing", "done"]);
const taskPriorityEnum = z.enum(["low", "normal", "high", "urgent"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  status: taskStatusEnum.default("todo"),
  priority: taskPriorityEnum.default("normal"),
  sortOrder: z.number().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  calendarId: z.string().min(1),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  sortOrder: z.number().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  calendarId: z.string().optional(),
});

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number(),
      status: taskStatusEnum.optional(),
    })
  ).min(1),
});

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format")
    .default("#6B7280"),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

// Template schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
  duration: z.number().int().min(1).max(1440),
  calendarId: z.string().optional(),
  participants: z.array(participantSchema).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  meetingLink: z.string().url().nullable().optional().or(z.literal("")),
  duration: z.number().int().min(1).max(1440).optional(),
  calendarId: z.string().nullable().optional(),
  participants: z.array(participantSchema).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

// Search schema
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["events", "tasks", "all"]).default("all"),
  calendarIds: z.string().optional(), // comma-separated
});

// Settings schemas
export const updateSettingsSchema = z.object({
  bufferMinutes: z.number().int().min(0).max(120).optional(),
  secondaryTimezone: z.string().nullable().optional(),
});

// Scheduling page schemas
export const createSchedulingPageSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  durations: z.array(z.number().int().min(5).max(480)).min(1).max(6),
  bufferMinutes: z.number().int().min(0).max(120).default(0),
  daysInAdvance: z.number().int().min(1).max(60).default(14),
  timezone: z.string().min(1),
  isActive: z.boolean().default(true),
  calendarId: z.string().nullable().optional(),
});

export const updateSchedulingPageSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  durations: z.array(z.number().int().min(5).max(480)).min(1).max(6).optional(),
  bufferMinutes: z.number().int().min(0).max(120).optional(),
  daysInAdvance: z.number().int().min(1).max(60).optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
  calendarId: z.string().nullable().optional(),
});

// Booking schema
export const bookingInputSchema = z.object({
  guestName: z.string().min(1, "Name is required").max(100),
  guestEmail: z.string().email("Valid email required"),
  guestMessage: z.string().max(1000).optional(),
  startTime: z.string().datetime(),
  duration: z.number().int().min(5).max(480),
  calendarId: z.string().optional(),
});

export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;
export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type CreateSchedulingPageInput = z.infer<typeof createSchedulingPageSchema>;
export type UpdateSchedulingPageInputValidated = z.infer<typeof updateSchedulingPageSchema>;
export type BookingInputValidated = z.infer<typeof bookingInputSchema>;
