import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validators";
import { parseTags, serializeTags, syncTagUsageCounts } from "@/lib/tag-utils";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const requestedCalendarIds = searchParams.get("calendarIds")?.split(",").filter(Boolean);
  const dueBefore = searchParams.get("dueBefore");
  const dueAfter = searchParams.get("dueAfter");
  const filterTags = searchParams.get("tags")?.split(",").filter(Boolean);

  // Fetch user's calendar IDs
  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true },
  });
  const userCalendarIds = userCalendars.map((c) => c.id);

  const effectiveCalendarIds = requestedCalendarIds?.length
    ? requestedCalendarIds.filter((id) => userCalendarIds.includes(id))
    : userCalendarIds;

  const where: Record<string, unknown> = {
    calendarId: { in: effectiveCalendarIds },
  };

  if (status) {
    where.status = status;
  }
  if (dueBefore || dueAfter) {
    const dateFilter: Record<string, Date> = {};
    if (dueBefore) dateFilter.lte = new Date(dueBefore);
    if (dueAfter) dateFilter.gte = new Date(dueAfter);
    where.dueDate = dateFilter;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  let serialized = tasks.map((t) => ({
    ...t,
    tags: parseTags(t.tags),
  }));

  // Filter by tags if specified
  if (filterTags?.length) {
    serialized = serialized.filter((t) =>
      filterTags.some((ft) => t.tags.includes(ft))
    );
  }

  return NextResponse.json({ tasks: serialized });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { tags, ...taskData } = parsed.data;

  // Verify calendar ownership
  const calendar = await prisma.calendar.findFirst({
    where: { id: taskData.calendarId, userId },
  });
  if (!calendar) {
    return NextResponse.json({ message: "Calendar not found" }, { status: 404 });
  }

  // Calculate sortOrder: put new task at end of its status group
  const lastTask = await prisma.task.findFirst({
    where: { status: taskData.status, calendarId: { in: [taskData.calendarId] } },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = taskData.sortOrder ?? (lastTask ? lastTask.sortOrder + 1 : 0);

  const task = await prisma.task.create({
    data: {
      ...taskData,
      sortOrder,
      tags: serializeTags(tags),
    },
  });

  // Sync tag usage counts
  if (tags && tags.length > 0) {
    await syncTagUsageCounts(prisma, tags, [], userId);
  }

  return NextResponse.json(
    { ...task, tags: parseTags(task.tags) },
    { status: 201 }
  );
}
