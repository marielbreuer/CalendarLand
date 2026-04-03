import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  await prisma.googleCalendarConnection.deleteMany({ where: { userId } });

  return NextResponse.json({ success: true });
}
