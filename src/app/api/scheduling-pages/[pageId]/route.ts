import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSchedulingPageSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

interface Params {
  params: Promise<{ pageId: string }>;
}

function serializeDurations(durations: number[]): string {
  return JSON.stringify(durations);
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

export async function GET(_req: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { pageId } = await params;
  const page = await prisma.schedulingPage.findFirst({
    where: { id: pageId, userId },
    include: {
      _count: { select: { bookings: true } },
      calendar: { select: { name: true, color: true } },
    },
  });

  if (!page) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...page,
    durations: parseDurations(page.durations),
    bookingCount: page._count.bookings,
    calendarName: page.calendar?.name ?? null,
    calendarColor: page.calendar?.color ?? null,
    calendar: undefined,
    _count: undefined,
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { pageId } = await params;
  const body = await request.json();
  const parsed = updateSchedulingPageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const owned = await prisma.schedulingPage.findFirst({ where: { id: pageId, userId } });
  if (!owned) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const { durations, calendarId, ...rest } = parsed.data;

  const page = await prisma.schedulingPage.update({
    where: { id: pageId },
    data: {
      ...rest,
      ...(durations !== undefined && { durations: serializeDurations(durations) }),
      ...(calendarId !== undefined && { calendarId: calendarId ?? null }),
    },
    include: { calendar: { select: { name: true, color: true } } },
  });

  return NextResponse.json({
    ...page,
    durations: parseDurations(page.durations),
    calendarName: page.calendar?.name ?? null,
    calendarColor: page.calendar?.color ?? null,
    calendar: undefined,
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { pageId } = await params;

  const owned = await prisma.schedulingPage.findFirst({ where: { id: pageId, userId } });
  if (!owned) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  await prisma.schedulingPage.delete({ where: { id: pageId } });

  return new NextResponse(null, { status: 204 });
}
