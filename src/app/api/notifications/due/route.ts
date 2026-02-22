import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const now = new Date();

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      fired: false,
      dismissed: false,
      fireAt: { lte: now },
    },
    orderBy: { fireAt: "asc" },
    take: 20,
  });

  return NextResponse.json({ notifications });
}
