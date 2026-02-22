import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseReminders, computeFireTimes } from "@/lib/reminder-utils";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const { type } = body;

  if (type === "event" && body.eventId) {
    // Verify ownership: event must belong to user's calendar
    const event = await prisma.event.findFirst({
      where: { id: body.eventId, calendar: { userId } },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Delete old unfired notifications for this event
    await prisma.notification.deleteMany({
      where: { eventId: event.id, fired: false },
    });

    // Recompute from reminders
    const reminders = parseReminders(event.reminders);
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

    return NextResponse.json({ synced: "event", eventId: event.id });
  }

  if (type === "tasks") {
    // Fetch user's calendar IDs
    const userCalendars = await prisma.calendar.findMany({
      where: { userId },
      select: { id: true },
    });
    const userCalendarIds = userCalendars.map((c) => c.id);

    // Find tasks due in next 2 days that don't already have a pending notification
    const now = new Date();
    const twoDaysFromNow = addDays(now, 2);

    const tasks = await prisma.task.findMany({
      where: {
        calendarId: { in: userCalendarIds },
        dueDate: { gte: now, lte: twoDaysFromNow },
        status: { not: "done" },
      },
    });

    let created = 0;
    for (const task of tasks) {
      // Check if notification already exists for this task
      const existing = await prisma.notification.findFirst({
        where: {
          taskId: task.id,
          userId,
          type: "task_deadline",
          fired: false,
        },
      });

      if (!existing && task.dueDate) {
        await prisma.notification.create({
          data: {
            type: "task_deadline",
            title: `Task due: ${task.title}`,
            body: `Task "${task.title}" is due ${task.dueDate.toLocaleDateString()}`,
            taskId: task.id,
            userId,
            fireAt: addDays(task.dueDate, -1) > now ? addDays(task.dueDate, -1) : now,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ synced: "tasks", created });
  }

  if (type === "daily_briefing") {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Check if briefing already exists for today (per-user)
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "daily_briefing",
        fireAt: { gte: todayStart, lte: todayEnd },
      },
    });

    if (existing) {
      return NextResponse.json({ synced: "daily_briefing", created: 0 });
    }

    // Fetch user's calendar IDs
    const userCalendars = await prisma.calendar.findMany({
      where: { userId },
      select: { id: true },
    });
    const userCalendarIds = userCalendars.map((c) => c.id);

    // Count today's events and tasks
    const eventCount = await prisma.event.count({
      where: {
        calendarId: { in: userCalendarIds },
        startTime: { gte: todayStart, lte: todayEnd },
        isException: false,
      },
    });

    const taskCount = await prisma.task.count({
      where: {
        calendarId: { in: userCalendarIds },
        dueDate: { gte: todayStart, lte: todayEnd },
        status: { not: "done" },
      },
    });

    const parts: string[] = [];
    if (eventCount > 0) parts.push(`${eventCount} event${eventCount > 1 ? "s" : ""}`);
    if (taskCount > 0) parts.push(`${taskCount} task${taskCount > 1 ? "s" : ""} due`);

    const briefingBody = parts.length > 0
      ? `You have ${parts.join(" and ")} today.`
      : "No events or tasks scheduled for today.";

    await prisma.notification.create({
      data: {
        type: "daily_briefing",
        title: "Good morning!",
        body: briefingBody,
        userId,
        fireAt: now,
        fired: true, // Show immediately
      },
    });

    return NextResponse.json({ synced: "daily_briefing", created: 1 });
  }

  return NextResponse.json({ message: "Invalid sync type" }, { status: 400 });
}
