import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseICS } from "@/lib/ics";

interface Params {
  params: Promise<{ calendarId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { calendarId } = await params;

  const calendar = await prisma.calendar.findFirst({ where: { id: calendarId, userId } });
  if (!calendar) return NextResponse.json({ message: "Not found" }, { status: 404 });

  let text: string;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }
    text = await (file as File).text();
  } catch {
    return NextResponse.json({ message: "Invalid form data" }, { status: 400 });
  }

  let events;
  try {
    events = await parseICS(text);
  } catch {
    return NextResponse.json({ message: "Failed to parse .ics file" }, { status: 400 });
  }

  if (events.length === 0) {
    return NextResponse.json({ message: "No events found in file" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;

  for (const e of events) {
    // Skip if event with same UID already exists in this calendar
    const existing = await prisma.event.findFirst({
      where: { id: e.uid, calendarId },
    });
    if (existing) { skipped++; continue; }

    await prisma.event.create({
      data: {
        id: e.uid.length > 25 ? undefined : e.uid, // use UID as ID if it fits cuid length
        title: e.title,
        description: e.description ?? null,
        location: e.location ?? null,
        startTime: e.startTime,
        endTime: e.endTime,
        isAllDay: e.isAllDay,
        timezone: e.timezone,
        calendarId,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped });
}
