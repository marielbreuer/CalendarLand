import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTagSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { tagId } = await params;
  const body = await request.json();
  const parsed = updateTagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const owned = await prisma.tag.findFirst({ where: { id: tagId, userId } });
  if (!owned) {
    return NextResponse.json({ message: "Tag not found" }, { status: 404 });
  }

  const tag = await prisma.tag.update({
    where: { id: tagId },
    data: parsed.data,
  });
  return NextResponse.json(tag);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { tagId } = await params;

  const owned = await prisma.tag.findFirst({ where: { id: tagId, userId } });
  if (!owned) {
    return NextResponse.json({ message: "Tag not found" }, { status: 404 });
  }

  await prisma.tag.delete({ where: { id: tagId } });
  return new NextResponse(null, { status: 204 });
}
