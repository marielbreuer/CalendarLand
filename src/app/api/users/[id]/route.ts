import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth-guard";
import bcrypt from "bcryptjs";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const adminCheck = requireAdmin(authResult);
  if (adminCheck) return adminCheck;

  const { id } = await params;
  const body = await request.json();
  const newPassword: string = body.password?.trim();

  const pwError = validatePassword(newPassword ?? "");
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const adminCheck = requireAdmin(authResult);
  if (adminCheck) return adminCheck;
  const { userId } = authResult;

  const { id } = await params;

  if (id === userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  await auditLog("user_deleted", {
    userId,
    details: { deletedUserId: id, deletedUserEmail: target.email },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({ success: true });
}
