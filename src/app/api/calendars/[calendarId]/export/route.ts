import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { buildICS } from "@/lib/ics";
import { parseTags } from "@/lib/tag-utils";

interface Params {
  params: Promise<{ calendarId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { calendarId } = await params;

  const calendar = await prisma.calendar.findFirst({ where: { id: calendarId, userId } });
  if (!calendar) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const events = await prisma.event.findMany({
    where: { calendarId, isException: false },
    include: { participants: true },
    orderBy: { startTime: "asc" },
  });

  const icsString = buildICS(
    calendar.name,
    events.map((e) => ({
      id: e.id,
      title: e.title,
      description: [
        e.description,
        parseTags(e.tags).length ? `Tags: ${parseTags(e.tags).join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n") || null,
      location: e.location,
      meetingLink: e.meetingLink,
      startTime: e.startTime,
      endTime: e.endTime,
      isAllDay: e.isAllDay,
      timezone: e.timezone,
      rrule: e.rrule,
      participants: e.participants,
    }))
  );

  const filename = calendar.name.replace(/[^a-zA-Z0-9\-_]/g, "_") + ".ics";

  return new Response(icsString, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
