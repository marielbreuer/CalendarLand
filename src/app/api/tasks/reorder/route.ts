import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reorderTasksSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = reorderTasksSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { tasks } = parsed.data;

  // Validate all task IDs belong to user's calendars
  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true },
  });
  const userCalendarIds = userCalendars.map((c) => c.id);

  const taskIds = tasks.map((t) => t.id);
  const ownedTasks = await prisma.task.findMany({
    where: { id: { in: taskIds }, calendarId: { in: userCalendarIds } },
    select: { id: true },
  });

  if (ownedTasks.length !== taskIds.length) {
    return NextResponse.json(
      { message: "One or more tasks not found" },
      { status: 404 }
    );
  }

  await prisma.$transaction(
    tasks.map((t) =>
      prisma.task.update({
        where: { id: t.id },
        data: {
          sortOrder: t.sortOrder,
          ...(t.status !== undefined && { status: t.status }),
        },
      })
    )
  );

  return NextResponse.json({ success: true });
}
