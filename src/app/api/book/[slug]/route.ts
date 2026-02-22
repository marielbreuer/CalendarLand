import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingInputSchema } from "@/lib/validators";
import { getAvailableSlots } from "@/lib/availability";
import type { SchedulingConfig } from "@/lib/availability";

interface Params {
  params: Promise<{ slug: string }>;
}

function parseDurations(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [30];
  } catch {
    return [30];
  }
}

function parseWorkingDays(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [1, 2, 3, 4, 5];
  } catch {
    return [1, 2, 3, 4, 5];
  }
}

type CalendarRow = {
  id: string;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  workingDays: string;
  isAlwaysAvailable: boolean;
  isDefault: boolean;
};

async function getSchedulingConfig(
  calendarId: string | null,
  pageBufferMinutes: number,
  pageOwnerId: string
): Promise<{ config: SchedulingConfig; ownerCalendarIds: string[] }> {
  // Fetch owner's calendar IDs for availability scoping
  const ownerCalendars: CalendarRow[] = await prisma.calendar.findMany({
    where: { userId: pageOwnerId },
    select: { id: true, workingHoursStart: true, workingHoursEnd: true, workingDays: true, isAlwaysAvailable: true, isDefault: true },
  });
  const ownerCalendarIds = ownerCalendars.map((c) => c.id);

  // Get owner's settings (non-destructive findFirst)
  const settings = await prisma.userSettings.findFirst({
    where: { userId: pageOwnerId },
  });
  const bufferMinutes = Math.max(settings?.bufferMinutes ?? 0, pageBufferMinutes);

  // If linked to a calendar, use its working hours/days
  if (calendarId) {
    const cal = ownerCalendars.find((c) => c.id === calendarId);
    if (cal) {
      return {
        config: {
          workingHoursStart: cal.workingHoursStart ?? "09:00",
          workingHoursEnd: cal.workingHoursEnd ?? "17:00",
          workingDays: parseWorkingDays(cal.workingDays),
          bufferMinutes,
          isAlwaysAvailable: cal.isAlwaysAvailable,
        },
        ownerCalendarIds,
      };
    }
  }

  // Fallback: use owner's default calendar settings
  const fallbackCal = ownerCalendars.find((c) => c.isDefault) ?? ownerCalendars[0];

  return {
    config: {
      workingHoursStart: fallbackCal?.workingHoursStart ?? "09:00",
      workingHoursEnd: fallbackCal?.workingHoursEnd ?? "17:00",
      workingDays: fallbackCal ? parseWorkingDays(fallbackCal.workingDays) : [1, 2, 3, 4, 5],
      bufferMinutes,
      isAlwaysAvailable: fallbackCal?.isAlwaysAvailable ?? false,
    },
    ownerCalendarIds,
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");
  const durationStr = searchParams.get("duration");

  const page = await prisma.schedulingPage.findUnique({
    where: { slug },
    include: { calendar: { select: { name: true, color: true } } },
  });

  if (!page || !page.isActive) {
    return NextResponse.json({ message: "Scheduling page not found" }, { status: 404 });
  }

  // Return page info when no date/duration provided
  if (!date || !durationStr) {
    return NextResponse.json({
      page: {
        ...page,
        durations: parseDurations(page.durations),
        calendarName: page.calendar?.name ?? null,
        calendar: undefined,
      },
    });
  }

  const duration = parseInt(durationStr, 10);
  const durations = parseDurations(page.durations);

  if (!durations.includes(duration)) {
    return NextResponse.json({ message: "Invalid duration" }, { status: 400 });
  }

  // Validate date is within daysInAdvance window
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestDate = new Date(date + "T00:00:00");
  const maxDate = new Date(today.getTime() + page.daysInAdvance * 86400000);

  if (requestDate < today || requestDate > maxDate) {
    return NextResponse.json({ slots: [] });
  }

  const { config, ownerCalendarIds } = await getSchedulingConfig(page.calendarId, page.bufferMinutes, page.userId);
  const slots = await getAvailableSlots(date, duration, config, 0, ownerCalendarIds);

  return NextResponse.json({ slots });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const body = await request.json();
  const parsed = bookingInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const page = await prisma.schedulingPage.findUnique({ where: { slug } });

  if (!page || !page.isActive) {
    return NextResponse.json({ message: "Scheduling page not found" }, { status: 404 });
  }

  const { guestName, guestEmail, guestMessage, startTime, duration } = parsed.data;

  // Verify this slot is still available
  const date = startTime.slice(0, 10);
  const { config, ownerCalendarIds } = await getSchedulingConfig(page.calendarId, page.bufferMinutes, page.userId);
  const slots = await getAvailableSlots(date, duration, config, 0, ownerCalendarIds);
  const isAvailable = slots.some((s) => s.startTime === startTime);

  if (!isAvailable) {
    return NextResponse.json(
      { message: "This time slot is no longer available" },
      { status: 409 }
    );
  }

  const endTime = new Date(new Date(startTime).getTime() + duration * 60000);

  // Use linked calendar, else fall back to owner's default calendar
  let resolvedCalendarId = page.calendarId;
  if (!resolvedCalendarId) {
    const defaultCal = await prisma.calendar.findFirst({ where: { userId: page.userId, isDefault: true } });
    const anyCal = defaultCal ?? await prisma.calendar.findFirst({ where: { userId: page.userId } });
    if (!anyCal) {
      return NextResponse.json({ message: "No calendar found" }, { status: 400 });
    }
    resolvedCalendarId = anyCal.id;
  }

  // Create the event
  const event = await prisma.event.create({
    data: {
      title: `Meeting with ${guestName}`,
      description: guestMessage || `Booked via ${page.title}`,
      startTime: new Date(startTime),
      endTime,
      timezone: page.timezone,
      calendarId: resolvedCalendarId,
    },
    include: { participants: true },
  });

  // Create the booking record
  const booking = await prisma.booking.create({
    data: {
      schedulingPageId: page.id,
      eventId: event.id,
      guestName,
      guestEmail,
      guestMessage: guestMessage || null,
      startTime: new Date(startTime),
      endTime,
      duration,
    },
  });

  return NextResponse.json({ booking, event }, { status: 201 });
}
