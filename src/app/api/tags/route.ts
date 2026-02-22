import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTagSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const q = request.nextUrl.searchParams.get("q");

  const tags = await prisma.tag.findMany({
    where: {
      userId,
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { usageCount: "desc" },
    take: 50,
  });

  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = createTagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  // Check for duplicate (per-user unique)
  const existing = await prisma.tag.findUnique({
    where: { userId_name: { userId, name: parsed.data.name } },
  });
  if (existing) {
    return NextResponse.json(
      { message: "Tag already exists" },
      { status: 409 }
    );
  }

  const tag = await prisma.tag.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(tag, { status: 201 });
}
