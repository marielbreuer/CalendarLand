import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validators";
import { parseTags, serializeTags, syncTagUsageCounts, diffTags } from "@/lib/tag-utils";
import { requireAuth } from "@/lib/auth-guard";

interface Params {
  params: Promise<{ taskId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { taskId } = await params;
  const task = await prisma.task.findFirst({
    where: { id: taskId, calendar: { userId } },
  });

  if (!task) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ ...task, tags: parseTags(task.tags) });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { taskId } = await params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const existing = await prisma.task.findFirst({
    where: { id: taskId, calendar: { userId } },
  });
  if (!existing) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  const { tags, ...taskData } = parsed.data;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...taskData,
      ...(tags !== undefined && { tags: serializeTags(tags) }),
    },
  });

  // Sync tag usage counts
  if (tags !== undefined) {
    const oldTags = parseTags(existing.tags);
    const { added, removed } = diffTags(oldTags, tags);
    await syncTagUsageCounts(prisma, added, removed, userId);
  }

  return NextResponse.json({ ...task, tags: parseTags(task.tags) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { taskId } = await params;

  const existing = await prisma.task.findFirst({
    where: { id: taskId, calendar: { userId } },
  });
  if (!existing) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  // Clean up notifications
  await prisma.notification.deleteMany({
    where: { taskId },
  });
  await prisma.task.delete({ where: { id: taskId } });
  // Sync tag counts
  const oldTags = parseTags(existing.tags);
  if (oldTags.length > 0) {
    await syncTagUsageCounts(prisma, [], oldTags, userId);
  }
  return new NextResponse(null, { status: 204 });
}
