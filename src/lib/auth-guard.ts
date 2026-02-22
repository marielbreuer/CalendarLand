import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface AuthSession {
  userId: string;
  role: string;
}

export async function requireAuth(): Promise<AuthSession | NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Verify the user actually exists in DB (catches stale sessions)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return { userId: user.id, role: user.role };
}

export function requireAdmin(a: AuthSession): NextResponse | null {
  if (a.role !== "admin")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  return null;
}
