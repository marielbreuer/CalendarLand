import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { buildTimesheetCsv } from "@/lib/csv";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const sp = request.nextUrl.searchParams;
  const start = sp.get("start");
  const end = sp.get("end");

  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true },
  });
  const calendarIds = userCalendars.map((c) => c.id);

  const where: Record<string, unknown> = {
    calendarId: { in: calendarIds },
    endedAt: { not: null },
  };
  if (start || end) {
    const dateFilter: Record<string, Date> = {};
    if (start) dateFilter.gte = new Date(start);
    if (end) dateFilter.lte = new Date(end);
    where.startedAt = dateFilter;
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    orderBy: { startedAt: "asc" },
    include: { calendar: { select: { id: true, name: true, color: true } } },
  });

  const csv = buildTimesheetCsv(entries as unknown as Parameters<typeof buildTimesheetCsv>[0]);

  const startLabel = start ? format(new Date(start), "yyyy-MM-dd") : "all";
  const endLabel = end ? format(new Date(end), "yyyy-MM-dd") : "all";
  const filename = `timesheet-${startLabel}-${endLabel}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
