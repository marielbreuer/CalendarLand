import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchQuerySchema } from "@/lib/validators";
import { parseTags } from "@/lib/tag-utils";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const searchParams = request.nextUrl.searchParams;
  const parsed = searchQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    type: searchParams.get("type") ?? "all",
    calendarIds: searchParams.get("calendarIds") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { q, type, calendarIds: calendarIdsStr } = parsed.data;
  const requestedCalendarIds = calendarIdsStr?.split(",").filter(Boolean);

  // Fetch user's calendar IDs for scoping
  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true },
  });
  const userCalendarIds = userCalendars.map((c) => c.id);

  // Intersect with requested calendarIds if provided
  const effectiveCalendarIds = requestedCalendarIds?.length
    ? requestedCalendarIds.filter((id) => userCalendarIds.includes(id))
    : userCalendarIds;

  const calendarFilter = effectiveCalendarIds.length > 0
    ? `AND "calendarId" IN (${effectiveCalendarIds.map((_, i) => `$${i + 2}`).join(",")})`
    : "AND 1=0"; // No calendars → no results

  const params: unknown[] = [q, ...effectiveCalendarIds];

  let events: unknown[] = [];
  let tasks: unknown[] = [];

  try {
    const promises: Promise<void>[] = [];

    if (type === "all" || type === "events") {
      promises.push(
        (async () => {
          // Try full-text search first, fallback to ILIKE
          try {
            events = await prisma.$queryRawUnsafe(
              `SELECT * FROM events
               WHERE to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, ''))
                     @@ plainto_tsquery('english', $1)
               ${calendarFilter}
               ORDER BY "startTime" DESC
               LIMIT 20`,
              ...params
            );
          } catch {
            // Fallback to ILIKE for partial matches
            events = await prisma.$queryRawUnsafe(
              `SELECT * FROM events
               WHERE (title ILIKE $1 OR COALESCE(description, '') ILIKE $1 OR COALESCE(location, '') ILIKE $1)
               ${calendarFilter.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n)}`)
                 .replace("$2", "$2")}
               ORDER BY "startTime" DESC
               LIMIT 20`,
              `%${q}%`,
              ...effectiveCalendarIds
            );
          }
        })()
      );
    }

    if (type === "all" || type === "tasks") {
      promises.push(
        (async () => {
          try {
            tasks = await prisma.$queryRawUnsafe(
              `SELECT * FROM tasks
               WHERE to_tsvector('english', title || ' ' || COALESCE(description, ''))
                     @@ plainto_tsquery('english', $1)
               ${calendarFilter}
               ORDER BY "createdAt" DESC
               LIMIT 20`,
              ...params
            );
          } catch {
            tasks = await prisma.$queryRawUnsafe(
              `SELECT * FROM tasks
               WHERE (title ILIKE $1 OR COALESCE(description, '') ILIKE $1)
               ${calendarFilter.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n)}`)
                 .replace("$2", "$2")}
               ORDER BY "createdAt" DESC
               LIMIT 20`,
              `%${q}%`,
              ...effectiveCalendarIds
            );
          }
        })()
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { message: "Search failed" },
      { status: 500 }
    );
  }

  // Serialize tags for both events and tasks
  interface RawRow { tags?: string | null; participants?: unknown }
  const serializedEvents = (events as RawRow[]).map((e) => ({
    ...e,
    tags: parseTags((e.tags as string) ?? null),
  }));
  const serializedTasks = (tasks as RawRow[]).map((t) => ({
    ...t,
    tags: parseTags((t.tags as string) ?? null),
  }));

  return NextResponse.json({
    events: serializedEvents,
    tasks: serializedTasks,
  });
}
