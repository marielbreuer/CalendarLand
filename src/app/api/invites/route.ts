import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth-guard";
import { addDays } from "date-fns";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const adminCheck = requireAdmin(authResult);
  if (adminCheck) return adminCheck;
  const { userId } = authResult;

  const invites = await prisma.invite.findMany({
    where: { createdBy: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const adminCheck = requireAdmin(authResult);
  if (adminCheck) return adminCheck;
  const { userId } = authResult;

  const body = await request.json();
  const email = body.email?.trim() || null;
  const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : 7;

  const invite = await prisma.invite.create({
    data: {
      email,
      createdBy: userId,
      expiresAt: addDays(new Date(), expiresInDays),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/register?token=${invite.token}`;

  return NextResponse.json({ invite, link }, { status: 201 });
}
