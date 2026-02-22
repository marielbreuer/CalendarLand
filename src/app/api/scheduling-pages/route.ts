import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSchedulingPageSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "meeting";
}

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const pages = await prisma.schedulingPage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bookings: true } },
      calendar: { select: { name: true, color: true } },
    },
  });

  return NextResponse.json({
    pages: pages.map((p) => ({
      ...p,
      durations: parseDurations(p.durations),
      bookingCount: p._count.bookings,
      calendarName: p.calendar?.name ?? null,
      calendarColor: p.calendar?.color ?? null,
      calendar: undefined,
      _count: undefined,
    })),
  });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = createSchedulingPageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { slug: rawSlug, durations, calendarId, ...rest } = parsed.data;

  // Verify calendar ownership if provided
  if (calendarId) {
    const cal = await prisma.calendar.findFirst({ where: { id: calendarId, userId } });
    if (!cal) {
      return NextResponse.json({ message: "Calendar not found" }, { status: 404 });
    }
  }

  // Ensure unique slug
  let slug = rawSlug || generateSlug(rest.title);
  const existing = await prisma.schedulingPage.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const page = await prisma.schedulingPage.create({
    data: {
      ...rest,
      slug,
      userId,
      durations: serializeDurations(durations),
      ...(calendarId ? { calendarId } : {}),
    },
    include: { calendar: { select: { name: true, color: true } } },
  });

  return NextResponse.json(
    {
      ...page,
      durations: parseDurations(page.durations),
      calendarName: page.calendar?.name ?? null,
      calendarColor: page.calendar?.color ?? null,
      calendar: undefined,
    },
    { status: 201 }
  );
}
