import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotificationSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const status = request.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = { userId, dismissed: false };
  if (status === "unread") {
    where.read = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { fireAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = createNotificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const notification = await prisma.notification.create({
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body,
      eventId: parsed.data.eventId || null,
      taskId: parsed.data.taskId || null,
      userId,
      fireAt: new Date(parsed.data.fireAt),
    },
  });

  return NextResponse.json(notification, { status: 201 });
}
