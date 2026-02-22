import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

function parseWorkingDays(raw: string): number[] {
  try { return JSON.parse(raw); } catch { return [1,2,3,4,5]; }
}

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const calendars = await prisma.calendar.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(
    calendars.map((c) => ({ ...c, workingDays: parseWorkingDays(c.workingDays) }))
  );
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = createCalendarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const calendar = await prisma.calendar.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      userId,
      sortOrder:
        (await prisma.calendar.count({ where: { userId } })) + 1,
    },
  });

  return NextResponse.json(calendar, { status: 201 });
}
