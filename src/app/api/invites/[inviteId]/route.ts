import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth-guard";

interface Params {
  params: Promise<{ inviteId: string }>;
}

export async function DELETE(_request: Request, { params }: Params) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const adminCheck = requireAdmin(authResult);
  if (adminCheck) return adminCheck;
  const { userId } = authResult;

  const { inviteId } = await params;

  const deleted = await prisma.invite.deleteMany({
    where: { id: inviteId, createdBy: userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ message: "Invite not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
