import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validators";
import { expandRecurrence } from "@/lib/recurrence";
import { differenceInMinutes } from "date-fns";
import { Prisma } from "@/generated/prisma/client";
import { parseTags, serializeTags, syncTagUsageCounts } from "@/lib/tag-utils";
import { parseReminders, serializeReminders, computeFireTimes } from "@/lib/reminder-utils";
import { requireAuth } from "@/lib/auth-guard";

function parseExDates(exDates: string | null): Set<string> {
  if (!exDates) return new Set();
  return new Set(exDates.split(",").map((d) => d.trim()).filter(Boolean));
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const requestedCalendarIds = searchParams.get("calendarIds")?.split(",").filter(Boolean);
  const filterTags = searchParams.get("tags")?.split(",").filter(Boolean);

  if (!start || !end) {
    return NextResponse.json(
      { message: "start and end query parameters are required" },
      { status: 400 }
    );
  }

  // Fetch user's calendar IDs
  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true },
  });
  const userCalendarIds = userCalendars.map((c) => c.id);

  // Intersect with requested calendarIds if provided
  const effectiveCalendarIds = requestedCalendarIds?.length
    ? requestedCalendarIds.filter((id) => userCalendarIds.includes(id))
    : userCalendarIds;

  const startDate = new Date(start);
  const endDate = new Date(end);

  const calendarFilter: Prisma.EventWhereInput = { calendarId: { in: effectiveCalendarIds } };

  // Fetch non-recurring, non-exception events in range
  const regularEvents = await prisma.event.findMany({
    where: {
      startTime: { lt: endDate },
      endTime: { gt: startDate },
      isException: false,
      isRecurring: false,
      ...calendarFilter,
    },
    include: { participants: true },
    orderBy: { startTime: "asc" },
  });

  // Fetch recurring master events whose series overlaps the range
  const recurringMasters = await prisma.event.findMany({
    where: {
      isRecurring: true,
      isException: false,
      startTime: { lte: endDate },
      OR: [
        { recurrenceEnd: null },
        { recurrenceEnd: { gte: startDate } },
      ],
      ...calendarFilter,
    },
    include: { participants: true },
  });

  // Fetch exception events for the recurring series
  const seriesIds = recurringMasters
    .map((e) => e.seriesId)
    .filter((id): id is string => id !== null);

  const exceptions =
    seriesIds.length > 0
      ? await prisma.event.findMany({
          where: {
            seriesId: { in: seriesIds },
            isException: true,
          },
          include: { participants: true },
        })
      : [];

  // Index exceptions by seriesId + date for fast lookup
  const exceptionMap = new Map<string, typeof exceptions[number]>();
  for (const ex of exceptions) {
    if (ex.seriesId && ex.originalDate) {
      exceptionMap.set(`${ex.seriesId}:${dateKey(ex.originalDate)}`, ex);
    }
  }

  // Build flat list of all occurrences
  const allEvents: Array<Record<string, unknown>> = [];

  // Add regular events
  for (const e of regularEvents) {
    allEvents.push({
      ...e,
      occurrenceDate: e.startTime.toISOString(),
      isVirtual: false,
      masterEventId: null,
    });
  }

  // Expand recurring masters into occurrences
  for (const master of recurringMasters) {
    if (!master.rrule) continue;

    const duration = differenceInMinutes(master.endTime, master.startTime);
    const excludedDates = parseExDates(master.exDates);

    const occurrences = expandRecurrence(
      master.rrule,
      master.startTime,
      duration,
      startDate,
      endDate
    );

    for (const occ of occurrences) {
      const occDateKey = dateKey(occ.startTime);

      // Skip excluded dates (individually deleted occurrences)
      if (excludedDates.has(occDateKey)) continue;

      // Check for an exception event on this date
      const exKey = `${master.seriesId}:${occDateKey}`;
      const exception = exceptionMap.get(exKey);

      if (exception) {
        // Use exception event data instead of master
        allEvents.push({
          ...exception,
          occurrenceDate: occ.startTime.toISOString(),
          isVirtual: false,
          masterEventId: master.id,
        });
      } else {
        // Virtual occurrence from master
        allEvents.push({
          ...master,
          startTime: occ.startTime,
          endTime: occ.endTime,
          occurrenceDate: occ.startTime.toISOString(),
          isVirtual: true,
          masterEventId: master.id,
        });
      }
    }
  }

  // Sort by startTime
  allEvents.sort((a, b) => {
    const aTime = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime as string).getTime();
    const bTime = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime as string).getTime();
    return aTime - bTime;
  });

  // Deserialize tags and reminders for all events
  let eventsWithTags = allEvents.map((e) => ({
    ...e,
    tags: parseTags(e.tags as string | null),
    reminders: parseReminders(e.reminders as string | null),
  }));

  // Filter by tags if specified
  if (filterTags?.length) {
    eventsWithTags = eventsWithTags.filter((e) =>
      filterTags.some((ft) => (e.tags as string[]).includes(ft))
    );
  }

  return NextResponse.json({ events: eventsWithTags });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { participants, tags, reminders, ...eventData } = parsed.data;

  // Verify calendar ownership
  const calendar = await prisma.calendar.findFirst({
    where: { id: eventData.calendarId, userId },
  });
  if (!calendar) {
    return NextResponse.json({ message: "Calendar not found" }, { status: 404 });
  }

  const event = await prisma.event.create({
    data: {
      ...eventData,
      meetingLink: eventData.meetingLink || null,
      description: eventData.description || null,
      location: eventData.location || null,
      recurrenceEnd: eventData.recurrenceEnd || null,
      rrule: eventData.rrule || null,
      tags: serializeTags(tags),
      reminders: serializeReminders(reminders),
      seriesId: eventData.isRecurring ? crypto.randomUUID() : null,
      participants: {
        create: participants || [],
      },
    },
    include: { participants: true },
  });

  // Sync tag usage counts
  if (tags && tags.length > 0) {
    await syncTagUsageCounts(prisma, tags, [], userId);
  }

  // Create reminder notifications
  if (reminders && reminders.length > 0) {
    const fireTimes = computeFireTimes(new Date(eventData.startTime), reminders);
    const now = new Date();
    const toCreate = fireTimes
      .filter((ft) => ft.fireAt > now)
      .map((ft) => ({
        type: "event_reminder" as const,
        title: `Reminder: ${event.title}`,
        body: `Event "${event.title}" starts in ${ft.minutes === 0 ? "now" : ft.minutes < 60 ? `${ft.minutes} minutes` : ft.minutes < 1440 ? `${Math.floor(ft.minutes / 60)} hour(s)` : `${Math.floor(ft.minutes / 1440)} day(s)`}`,
        eventId: event.id,
        userId,
        fireAt: ft.fireAt,
      }));
    if (toCreate.length > 0) {
      await prisma.notification.createMany({ data: toCreate });
    }
  }

  // Server-side conflict check (non-blocking warning)
  let conflicts: Array<{ id: string; title: string; startTime: Date; endTime: Date }> = [];
  if (!eventData.isAllDay) {
    const overlapping = await prisma.event.findMany({
      where: {
        id: { not: event.id },
        isAllDay: false,
        isException: false,
        startTime: { lt: new Date(eventData.endTime) },
        endTime: { gt: new Date(eventData.startTime) },
        calendarId: eventData.calendarId,
      },
      select: { id: true, title: true, startTime: true, endTime: true },
      take: 5,
    });
    conflicts = overlapping;
  }

  return NextResponse.json(
    { ...event, tags: parseTags(event.tags), reminders: parseReminders(event.reminders), conflicts },
    { status: 201 }
  );
}
