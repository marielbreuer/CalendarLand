import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateEventSchema } from "@/lib/validators";
import { parseTags, serializeTags, syncTagUsageCounts, diffTags } from "@/lib/tag-utils";
import { parseReminders, serializeReminders, computeFireTimes } from "@/lib/reminder-utils";
import { requireAuth } from "@/lib/auth-guard";

interface Params {
  params: Promise<{ eventId: string }>;
}

async function findConflicts(
  eventId: string,
  startTime: Date,
  endTime: Date,
  calendarId: string,
  isAllDay: boolean
) {
  if (isAllDay) return [];
  return prisma.event.findMany({
    where: {
      id: { not: eventId },
      isAllDay: false,
      isException: false,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      calendarId,
    },
    select: { id: true, title: true, startTime: true, endTime: true },
    take: 5,
  });
}

export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { eventId } = await params;
  const event = await prisma.event.findFirst({
    where: { id: eventId, calendar: { userId } },
    include: { participants: true },
  });

  if (!event) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ ...event, tags: parseTags(event.tags), reminders: parseReminders(event.reminders) });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { eventId } = await params;
  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const scope = request.nextUrl.searchParams.get("scope") as
    | "single"
    | "future"
    | "all"
    | null;
  const occurrenceDate = request.nextUrl.searchParams.get("occurrenceDate");
  const { participants, tags, reminders, ...eventData } = parsed.data;

  const masterEvent = await prisma.event.findFirst({
    where: { id: eventId, calendar: { userId } },
    include: { participants: true },
  });

  if (!masterEvent) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 });
  }

  // Non-recurring event or no scope: simple update
  if (!masterEvent.isRecurring || !scope || scope === "all") {
    // If making a non-recurring event recurring, assign a seriesId
    const needsSeriesId =
      !masterEvent.isRecurring && eventData.isRecurring && !masterEvent.seriesId;
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...eventData,
        ...(needsSeriesId && { seriesId: crypto.randomUUID() }),
        ...(tags !== undefined && { tags: serializeTags(tags) }),
        ...(reminders !== undefined && { reminders: serializeReminders(reminders) }),
        ...(participants !== undefined && {
          participants: {
            deleteMany: {},
            create: participants,
          },
        }),
      },
      include: { participants: true },
    });
    // Sync tag usage counts
    if (tags !== undefined) {
      const oldTags = parseTags(masterEvent.tags);
      const { added, removed } = diffTags(oldTags, tags);
      await syncTagUsageCounts(prisma, added, removed, userId);
    }
    // Sync reminder notifications
    if (reminders !== undefined) {
      await prisma.notification.deleteMany({
        where: { eventId: event.id, fired: false },
      });
      if (reminders.length > 0) {
        const fireTimes = computeFireTimes(event.startTime, reminders);
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
    }
    const conflicts = await findConflicts(
      event.id,
      event.startTime,
      event.endTime,
      event.calendarId,
      event.isAllDay
    );
    return NextResponse.json({ ...event, tags: parseTags(event.tags), reminders: parseReminders(event.reminders), conflicts });
  }

  // Scope: "single" — create exception event for this one occurrence
  if (scope === "single" && occurrenceDate) {
    const occDate = new Date(occurrenceDate);
    const duration =
      masterEvent.endTime.getTime() - masterEvent.startTime.getTime();

    // Compute the occurrence's original times
    const originalStart = eventData.startTime
      ? new Date(eventData.startTime)
      : occDate;
    const originalEnd = eventData.endTime
      ? new Date(eventData.endTime)
      : new Date(occDate.getTime() + duration);

    const exception = await prisma.event.create({
      data: {
        title: eventData.title ?? masterEvent.title,
        description:
          eventData.description !== undefined
            ? eventData.description
            : masterEvent.description,
        location:
          eventData.location !== undefined
            ? eventData.location
            : masterEvent.location,
        meetingLink:
          eventData.meetingLink !== undefined
            ? eventData.meetingLink
            : masterEvent.meetingLink,
        startTime: originalStart,
        endTime: originalEnd,
        isAllDay: eventData.isAllDay ?? masterEvent.isAllDay,
        timezone: eventData.timezone ?? masterEvent.timezone,
        calendarId: eventData.calendarId ?? masterEvent.calendarId,
        isRecurring: false,
        isException: true,
        seriesId: masterEvent.seriesId,
        originalDate: occDate,
        participants: {
          create: participants ?? masterEvent.participants.map((p) => ({
            name: p.name,
            email: p.email,
          })),
        },
      },
      include: { participants: true },
    });
    return NextResponse.json(exception, { status: 201 });
  }

  // Scope: "future" — end the current series before this date, create new series from this date
  if (scope === "future" && occurrenceDate) {
    const occDate = new Date(occurrenceDate);
    const splitDate = new Date(occDate.getTime() - 1);

    // End the current series just before this occurrence
    await prisma.event.update({
      where: { id: eventId },
      data: { recurrenceEnd: splitDate },
    });

    // Create a new master event for the "future" portion
    const duration =
      masterEvent.endTime.getTime() - masterEvent.startTime.getTime();
    const newStart = eventData.startTime
      ? new Date(eventData.startTime)
      : occDate;
    const newEnd = eventData.endTime
      ? new Date(eventData.endTime)
      : new Date(newStart.getTime() + duration);

    const newMaster = await prisma.event.create({
      data: {
        title: eventData.title ?? masterEvent.title,
        description:
          eventData.description !== undefined
            ? eventData.description
            : masterEvent.description,
        location:
          eventData.location !== undefined
            ? eventData.location
            : masterEvent.location,
        meetingLink:
          eventData.meetingLink !== undefined
            ? eventData.meetingLink
            : masterEvent.meetingLink,
        startTime: newStart,
        endTime: newEnd,
        isAllDay: eventData.isAllDay ?? masterEvent.isAllDay,
        timezone: eventData.timezone ?? masterEvent.timezone,
        calendarId: eventData.calendarId ?? masterEvent.calendarId,
        isRecurring: true,
        rrule: eventData.rrule !== undefined ? eventData.rrule : masterEvent.rrule,
        recurrenceEnd: masterEvent.recurrenceEnd,
        seriesId: crypto.randomUUID(),
        participants: {
          create: participants ?? masterEvent.participants.map((p) => ({
            name: p.name,
            email: p.email,
          })),
        },
      },
      include: { participants: true },
    });

    return NextResponse.json(newMaster, { status: 201 });
  }

  // Fallback: simple update
  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...eventData,
      ...(participants !== undefined && {
        participants: {
          deleteMany: {},
          create: participants,
        },
      }),
    },
    include: { participants: true },
  });
  return NextResponse.json(event);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { eventId } = await params;
  const scope = request.nextUrl.searchParams.get("scope") as
    | "single"
    | "future"
    | "all"
    | null;
  const occurrenceDate = request.nextUrl.searchParams.get("occurrenceDate");

  const event = await prisma.event.findFirst({
    where: { id: eventId, calendar: { userId } },
  });
  if (!event) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 });
  }

  // Non-recurring or "all": delete the master and all exceptions
  if (!event.isRecurring || !scope || scope === "all") {
    // Clean up notifications
    await prisma.notification.deleteMany({
      where: { eventId },
    });
    // Delete exceptions first if this is a recurring series
    if (event.seriesId) {
      await prisma.event.deleteMany({
        where: { seriesId: event.seriesId, isException: true },
      });
    }
    await prisma.event.delete({ where: { id: eventId } });
    // Sync tag counts
    const oldTags = parseTags(event.tags);
    if (oldTags.length > 0) {
      await syncTagUsageCounts(prisma, [], oldTags, userId);
    }
    return new NextResponse(null, { status: 204 });
  }

  // Scope: "single" — add the occurrence date to exDates
  if (scope === "single" && occurrenceDate) {
    const dateStr = new Date(occurrenceDate).toISOString().slice(0, 10);
    const currentExDates = event.exDates ?? "";
    const newExDates = currentExDates
      ? `${currentExDates},${dateStr}`
      : dateStr;

    await prisma.event.update({
      where: { id: eventId },
      data: { exDates: newExDates },
    });

    // Also delete any exception event for this date
    if (event.seriesId) {
      const occDate = new Date(occurrenceDate);
      const dayStart = new Date(occDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(occDate);
      dayEnd.setUTCHours(23, 59, 59, 999);

      await prisma.event.deleteMany({
        where: {
          seriesId: event.seriesId,
          isException: true,
          originalDate: { gte: dayStart, lte: dayEnd },
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  }

  // Scope: "future" — end the series before this occurrence
  if (scope === "future" && occurrenceDate) {
    const occDate = new Date(occurrenceDate);
    const splitDate = new Date(occDate.getTime() - 1);

    // Delete future exceptions
    if (event.seriesId) {
      await prisma.event.deleteMany({
        where: {
          seriesId: event.seriesId,
          isException: true,
          originalDate: { gte: occDate },
        },
      });
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { recurrenceEnd: splitDate },
    });

    return new NextResponse(null, { status: 204 });
  }

  // Fallback
  await prisma.event.delete({ where: { id: eventId } });
  return new NextResponse(null, { status: 204 });
}
