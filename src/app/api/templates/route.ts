import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTemplateSchema } from "@/lib/validators";
import { parseTags, serializeTags, parseParticipants, serializeParticipants } from "@/lib/tag-utils";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const templates = await prisma.eventTemplate.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const serialized = templates.map((t) => ({
    ...t,
    tags: parseTags(t.tags),
    participants: parseParticipants(t.participants),
  }));

  return NextResponse.json({ templates: serialized });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = createTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { tags, participants, ...data } = parsed.data;

  const template = await prisma.eventTemplate.create({
    data: {
      ...data,
      userId,
      tags: serializeTags(tags),
      participants: serializeParticipants(participants),
    },
  });

  return NextResponse.json(
    {
      ...template,
      tags: parseTags(template.tags),
      participants: parseParticipants(template.participants),
    },
    { status: 201 }
  );
}
