import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTemplateSchema } from "@/lib/validators";
import { parseTags, serializeTags, parseParticipants, serializeParticipants } from "@/lib/tag-utils";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { templateId } = await params;

  const template = await prisma.eventTemplate.findFirst({
    where: { id: templateId, userId },
  });

  if (!template) {
    return NextResponse.json(
      { message: "Template not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...template,
    tags: parseTags(template.tags),
    participants: parseParticipants(template.participants),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { templateId } = await params;
  const body = await request.json();
  const parsed = updateTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const owned = await prisma.eventTemplate.findFirst({ where: { id: templateId, userId } });
  if (!owned) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 });
  }

  const { tags, participants, ...data } = parsed.data;
  const updateData: Record<string, unknown> = { ...data };
  if (tags !== undefined) updateData.tags = serializeTags(tags);
  if (participants !== undefined) updateData.participants = serializeParticipants(participants);

  const template = await prisma.eventTemplate.update({
    where: { id: templateId },
    data: updateData,
  });

  return NextResponse.json({
    ...template,
    tags: parseTags(template.tags),
    participants: parseParticipants(template.participants),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { templateId } = await params;

  const owned = await prisma.eventTemplate.findFirst({ where: { id: templateId, userId } });
  if (!owned) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 });
  }

  await prisma.eventTemplate.delete({ where: { id: templateId } });
  return new NextResponse(null, { status: 204 });
}
