import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCalendarSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

interface Params {
  params: Promise<{ calendarId: string }>;
}

function serializeCalendar(c: { workingDays: string; [key: string]: unknown }) {
  return {
    ...c,
    workingDays: (() => {
      try { return JSON.parse(c.workingDays as string); } catch { return [1,2,3,4,5]; }
    })(),
  };
}

export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { calendarId } = await params;
  const calendar = await prisma.calendar.findFirst({
    where: { id: calendarId, userId },
  });

  if (!calendar) {
    return NextResponse.json({ message: "Calendar not found" }, { status: 404 });
  }

  return NextResponse.json(serializeCalendar(calendar));
}

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { calendarId } = await params;
  const body = await request.json();
  const parsed = updateCalendarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const owned = await prisma.calendar.findFirst({ where: { id: calendarId, userId } });
  if (!owned) {
    return NextResponse.json({ message: "Calendar not found" }, { status: 404 });
  }

  const { workingDays, ...rest } = parsed.data;

  const calendar = await prisma.calendar.update({
    where: { id: calendarId },
    data: {
      ...rest,
      ...(workingDays !== undefined && { workingDays: JSON.stringify(workingDays) }),
    },
  });

  return NextResponse.json(serializeCalendar(calendar));
}

export async function DELETE(_request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { calendarId } = await params;
  const owned = await prisma.calendar.findFirst({ where: { id: calendarId, userId } });
  if (!owned) {
    return NextResponse.json({ message: "Calendar not found" }, { status: 404 });
  }

  await prisma.calendar.delete({ where: { id: calendarId } });
  return new NextResponse(null, { status: 204 });
}
