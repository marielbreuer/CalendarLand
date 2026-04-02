import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTimeEntrySchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";
import { differenceInMinutes } from "date-fns";

async function getEntry(entryId: string, userId: string) {
  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true },
  });
  const calendarIds = userCalendars.map((c) => c.id);
  return prisma.timeEntry.findFirst({
    where: { id: entryId, calendarId: { in: calendarIds } },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;
  const { entryId } = await params;

  const entry = await getEntry(entryId, userId);
  if (!entry) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ timeEntry: entry });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;
  const { entryId } = await params;

  const entry = await getEntry(entryId, userId);
  if (!entry) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 });
  }

  const { endedAt, duration, ...rest } = parsed.data;

  let computedDuration = duration;
  if (endedAt && computedDuration === undefined) {
    computedDuration = differenceInMinutes(new Date(endedAt), entry.startedAt);
  }

  const updated = await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      ...rest,
      ...(endedAt !== undefined ? { endedAt: endedAt ? new Date(endedAt) : null } : {}),
      ...(computedDuration !== undefined ? { duration: computedDuration } : {}),
    },
  });

  return NextResponse.json({ timeEntry: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;
  const { entryId } = await params;

  const entry = await getEntry(entryId, userId);
  if (!entry) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.timeEntry.delete({ where: { id: entryId } });
  return new NextResponse(null, { status: 204 });
}
