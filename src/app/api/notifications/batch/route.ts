import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { batchUpdateNotificationsSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = batchUpdateNotificationsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { ids, update } = parsed.data;

  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId },
    data: update,
  });

  return NextResponse.json({ updated: ids.length });
}
