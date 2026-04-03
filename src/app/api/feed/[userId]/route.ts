import { prisma } from "@/lib/prisma";
import { buildICS } from "@/lib/ics";

interface Params {
  params: Promise<{ userId: string }>;
}

/** Public iCal feed — no auth required, URL acts as the secret. */
export async function GET(_request: Request, { params }: Params) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
  if (!user) {
    return new Response("Not found", { status: 404 });
  }

  // Fetch all non-exception events across all user calendars
  const calendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  const calendarIds = calendars.map((c) => c.id);

  const events = await prisma.event.findMany({
    where: { calendarId: { in: calendarIds }, isException: false },
    include: { participants: true },
    orderBy: { startTime: "asc" },
  });

  const icsString = buildICS(`${user.name}'s Calendar`, events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    meetingLink: e.meetingLink,
    startTime: e.startTime,
    endTime: e.endTime,
    isAllDay: e.isAllDay,
    timezone: e.timezone,
    rrule: e.rrule,
    participants: e.participants,
  })));

  return new Response(icsString, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
    },
  });
}
