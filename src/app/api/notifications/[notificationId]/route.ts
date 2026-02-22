import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateNotificationSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

interface Params {
  params: Promise<{ notificationId: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { notificationId } = await params;
  const body = await request.json();
  const parsed = updateNotificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!existing) {
    return NextResponse.json(
      { message: "Notification not found" },
      { status: 404 }
    );
  }

  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: parsed.data,
  });

  return NextResponse.json(notification);
}

export async function DELETE(_request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { notificationId } = await params;

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!existing) {
    return NextResponse.json(
      { message: "Notification not found" },
      { status: 404 }
    );
  }

  await prisma.notification.delete({ where: { id: notificationId } });
  return new NextResponse(null, { status: 204 });
}
