/**
 * Minimal RFC 5545 ICS builder and parser.
 * Builder: no dependencies.
 * Parser: uses node-ical.
 */

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function formatDt(date: Date, allDay: boolean): string {
  if (allDay) return date.toISOString().slice(0, 10).replace(/-/g, "");
  return date.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

export type ICSEvent = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  meetingLink?: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  timezone: string;
  rrule?: string | null;
  participants?: { name: string; email: string }[];
};

export function buildICS(calendarName: string, events: ICSEvent[]): string {
  const now = formatDt(new Date(), false);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Calendar Land//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(calendarName)}`,
  ];

  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.id}@calendarland`);
    lines.push(`DTSTAMP:${now}`);

    if (e.isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatDt(e.startTime, true)}`);
      lines.push(`DTEND;VALUE=DATE:${formatDt(e.endTime, true)}`);
    } else {
      lines.push(`DTSTART:${formatDt(e.startTime, false)}`);
      lines.push(`DTEND:${formatDt(e.endTime, false)}`);
    }

    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.meetingLink) lines.push(`URL:${e.meetingLink}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);

    for (const p of e.participants ?? []) {
      lines.push(`ATTENDEE;CN=${esc(p.name)}:mailto:${p.email}`);
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export type ParsedICSEvent = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  timezone: string;
  rrule?: string;
};

export async function parseICS(text: string): Promise<ParsedICSEvent[]> {
  const ical = await import("node-ical");
  const parsed = ical.sync.parseICS(text);
  const results: ParsedICSEvent[] = [];

  for (const comp of Object.values(parsed)) {
    if (!comp || comp.type !== "VEVENT") continue;

    // Cast to VEvent for typed access
    type VEvent = { uid?: string; summary?: string; description?: string; location?: string; start: Date | string; end: Date | string };
    const e = comp as VEvent;

    const startTime = e.start instanceof Date ? e.start : new Date(e.start as string);
    const endTime = e.end instanceof Date ? e.end : new Date(e.end as string);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) continue;

    // node-ical sets datetype = "date" for all-day events
    const isAllDay = (e as unknown as Record<string, unknown>).datetype === "date";
    const timezone = (e as unknown as Record<string, unknown>).tz as string || "UTC";

    results.push({
      uid: e.uid ?? crypto.randomUUID(),
      title: e.summary ?? "Untitled",
      description: e.description || undefined,
      location: e.location || undefined,
      startTime,
      endTime,
      isAllDay,
      timezone,
    });
  }

  return results;
}
