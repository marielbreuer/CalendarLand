import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";
import type { GoogleCalendarConnection } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// OAuth client
// ---------------------------------------------------------------------------

function getRedirectUri() {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/auth/google/callback`;
}

export function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    getRedirectUri()
  );
}

export function getAuthUrl(state: string): string {
  const client = buildOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    prompt: "consent", // always prompt so we get a refresh_token
    state,
  });
}

// ---------------------------------------------------------------------------
// Authenticated client with auto-refresh
// ---------------------------------------------------------------------------

export async function getClientForUser(userId: string) {
  const conn = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (!conn) return null;

  const client = buildOAuthClient();
  client.setCredentials({
    access_token: conn.accessToken,
    refresh_token: conn.refreshToken,
    expiry_date: conn.expiresAt.getTime(),
  });

  // Refresh if token expires within 5 minutes
  if (conn.expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
    try {
      const { credentials } = await client.refreshAccessToken();
      await prisma.googleCalendarConnection.update({
        where: { userId },
        data: {
          accessToken: credentials.access_token!,
          expiresAt: new Date(credentials.expiry_date!),
        },
      });
      client.setCredentials(credentials);
    } catch {
      // Refresh failed — connection is stale
      return null;
    }
  }

  return { client, conn };
}

// ---------------------------------------------------------------------------
// Push sync helpers  (Calendar Land → Google)
// ---------------------------------------------------------------------------

type EventForGoogle = {
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  timezone: string;
  rrule?: string | null;
};

function toGoogleEvent(e: EventForGoogle) {
  if (e.isAllDay) {
    return {
      summary: e.title,
      description: e.description ?? undefined,
      location: e.location ?? undefined,
      start: { date: e.startTime.toISOString().slice(0, 10) },
      end: { date: e.endTime.toISOString().slice(0, 10) },
    };
  }
  return {
    summary: e.title,
    description: e.description ?? undefined,
    location: e.location ?? undefined,
    start: { dateTime: e.startTime.toISOString(), timeZone: e.timezone || "UTC" },
    end: { dateTime: e.endTime.toISOString(), timeZone: e.timezone || "UTC" },
    ...(e.rrule ? { recurrence: [`RRULE:${e.rrule}`] } : {}),
  };
}

/** Fire-and-forget: create event in Google after it's saved in Calendar Land. */
export async function pushEventCreate(
  userId: string,
  event: EventForGoogle & { id: string; calendarId: string }
): Promise<void> {
  try {
    const result = await getClientForUser(userId);
    if (!result) return;
    const { client, conn } = result;
    if (conn.calendarId !== event.calendarId) return;

    const cal = google.calendar({ version: "v3", auth: client });
    const res = await cal.events.insert({
      calendarId: conn.googleCalendarId,
      requestBody: toGoogleEvent(event),
    });

    if (res.data.id) {
      await prisma.event.update({
        where: { id: event.id },
        data: { googleEventId: res.data.id },
      });
    }
  } catch (err) {
    console.error("[google-sync] pushEventCreate failed:", err);
  }
}

/** Fire-and-forget: update event in Google. */
export async function pushEventUpdate(
  userId: string,
  event: EventForGoogle & { id: string; calendarId: string; googleEventId?: string | null }
): Promise<void> {
  try {
    if (!event.googleEventId) return;
    const result = await getClientForUser(userId);
    if (!result) return;
    const { client, conn } = result;
    if (conn.calendarId !== event.calendarId) return;

    const cal = google.calendar({ version: "v3", auth: client });
    await cal.events.update({
      calendarId: conn.googleCalendarId,
      eventId: event.googleEventId,
      requestBody: toGoogleEvent(event),
    });
  } catch (err) {
    console.error("[google-sync] pushEventUpdate failed:", err);
  }
}

/** Fire-and-forget: delete event in Google. */
export async function pushEventDelete(
  userId: string,
  calendarId: string,
  googleEventId: string
): Promise<void> {
  try {
    const result = await getClientForUser(userId);
    if (!result) return;
    const { client, conn } = result;
    if (conn.calendarId !== calendarId) return;

    const cal = google.calendar({ version: "v3", auth: client });
    await cal.events.delete({
      calendarId: conn.googleCalendarId,
      eventId: googleEventId,
    });
  } catch (err) {
    console.error("[google-sync] pushEventDelete failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Pull sync  (Google → Calendar Land)
// ---------------------------------------------------------------------------

export async function pullSync(
  userId: string
): Promise<{ added: number; updated: number; deleted: number }> {
  const result = await getClientForUser(userId);
  if (!result) throw new Error("Not connected to Google Calendar");
  const { client, conn } = result;
  if (!conn.calendarId) throw new Error("No Calendar Land calendar linked for sync");

  const cal = google.calendar({ version: "v3", auth: client });

  let added = 0, updated = 0, deleted = 0;
  let currentSyncToken: string | null = conn.syncToken ?? null;
  let pageToken: string | undefined;

  const params: calendar_v3.Params$Resource$Events$List = {
    calendarId: conn.googleCalendarId,
    maxResults: 250,
    singleEvents: true,
    showDeleted: true,
  };

  if (currentSyncToken) {
    params.syncToken = currentSyncToken;
  } else {
    // Full sync: last 12 months
    params.timeMin = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    params.orderBy = "updated";
  }

  do {
    if (pageToken) params.pageToken = pageToken;

    let res;
    try {
      res = await cal.events.list(params);
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e.code === 410) {
        // syncToken expired — fall back to full sync
        delete params.syncToken;
        params.timeMin = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
        params.orderBy = "updated";
        currentSyncToken = null;
        res = await cal.events.list(params);
      } else {
        throw err;
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
    if (res.data.nextSyncToken) currentSyncToken = res.data.nextSyncToken;

    for (const gEvent of res.data.items ?? []) {
      if (!gEvent.id) continue;

      if (gEvent.status === "cancelled") {
        const existing = await prisma.event.findFirst({
          where: { googleEventId: gEvent.id, calendar: { userId } },
        });
        if (existing) {
          await prisma.event.delete({ where: { id: existing.id } });
          deleted++;
        }
        continue;
      }

      const startTime = gEvent.start?.dateTime
        ? new Date(gEvent.start.dateTime)
        : gEvent.start?.date
        ? new Date(gEvent.start.date + "T00:00:00Z")
        : null;
      const endTime = gEvent.end?.dateTime
        ? new Date(gEvent.end.dateTime)
        : gEvent.end?.date
        ? new Date(gEvent.end.date + "T00:00:00Z")
        : null;

      if (!startTime || !endTime) continue;

      const isAllDay = !gEvent.start?.dateTime;
      const timezone = gEvent.start?.timeZone ?? "UTC";

      const existing = await prisma.event.findFirst({
        where: { googleEventId: gEvent.id, calendar: { userId } },
      });

      if (existing) {
        await prisma.event.update({
          where: { id: existing.id },
          data: {
            title: gEvent.summary ?? "Untitled",
            description: gEvent.description ?? null,
            location: gEvent.location ?? null,
            startTime,
            endTime,
            isAllDay,
            timezone,
          },
        });
        updated++;
      } else {
        await prisma.event.create({
          data: {
            title: gEvent.summary ?? "Untitled",
            description: gEvent.description ?? null,
            location: gEvent.location ?? null,
            startTime,
            endTime,
            isAllDay,
            timezone,
            calendarId: conn.calendarId!,
            googleEventId: gEvent.id,
          },
        });
        added++;
      }
    }
  } while (pageToken);

  await prisma.googleCalendarConnection.update({
    where: { userId },
    data: { syncToken: currentSyncToken, lastSyncedAt: new Date() },
  });

  return { added, updated, deleted };
}

// ---------------------------------------------------------------------------
// List Google calendars
// ---------------------------------------------------------------------------

export async function listGoogleCalendars(userId: string) {
  const result = await getClientForUser(userId);
  if (!result) return [];
  const { client } = result;

  const cal = google.calendar({ version: "v3", auth: client });
  const res = await cal.calendarList.list();
  return (res.data.items ?? []).map((c) => ({
    id: c.id!,
    summary: c.summary ?? "Untitled",
    primary: c.primary ?? false,
  }));
}

// Keep type accessible for other files
export type { GoogleCalendarConnection };
