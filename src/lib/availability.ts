import { prisma } from "@/lib/prisma";
import { expandRecurrence } from "@/lib/recurrence";
import { differenceInMinutes, addMinutes } from "date-fns";
import type { TimeSlot } from "@/types/scheduling";

export interface SchedulingConfig {
  workingHoursStart: string; // "HH:mm"
  workingHoursEnd: string;   // "HH:mm"
  workingDays: number[];     // 0=Sun … 6=Sat
  bufferMinutes: number;
  isAlwaysAvailable?: boolean; // skip working hours/days filter
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function parseExDates(exDates: string | null): Set<string> {
  if (!exDates) return new Set();
  return new Set(exDates.split(",").map((d) => d.trim()).filter(Boolean));
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function eventsOverlap(s1: Date, e1: Date, s2: Date, e2: Date): boolean {
  return s1 < e2 && e1 > s2;
}

export async function getAvailableSlots(
  date: string, // YYYY-MM-DD
  duration: number, // minutes
  config: SchedulingConfig,
  pageBufferMinutes = 0,
  ownerCalendarIds?: string[]
): Promise<TimeSlot[]> {
  const dayDate = new Date(date + "T00:00:00");
  const dayOfWeek = dayDate.getDay(); // 0=Sun

  // Check if it's a working day (skip when fully available)
  if (!config.isAlwaysAvailable && !config.workingDays.includes(dayOfWeek)) {
    return [];
  }

  // Check if the date is in the past
  const now = new Date();
  const dayEnd = new Date(date + "T23:59:59");
  if (dayEnd < now) {
    return [];
  }

  const workingStartMins = config.isAlwaysAvailable
    ? 0
    : parseTimeToMinutes(config.workingHoursStart);
  const workingEndMins = config.isAlwaysAvailable
    ? 24 * 60
    : parseTimeToMinutes(config.workingHoursEnd);

  if (workingStartMins >= workingEndMins) {
    return [];
  }

  // Fetch events scoped to owner's calendars if provided
  const dayStart = new Date(date + "T00:00:00");
  const nextDayStart = new Date(date + "T23:59:59");

  const calendarFilter = ownerCalendarIds
    ? { calendarId: { in: ownerCalendarIds } }
    : {};

  const regularEvents = await prisma.event.findMany({
    where: {
      ...calendarFilter,
      startTime: { lt: nextDayStart },
      endTime: { gt: dayStart },
      isException: false,
      isRecurring: false,
    },
  });

  const recurringMasters = await prisma.event.findMany({
    where: {
      ...calendarFilter,
      isRecurring: true,
      isException: false,
      startTime: { lte: nextDayStart },
      OR: [{ recurrenceEnd: null }, { recurrenceEnd: { gte: dayStart } }],
    },
  });

  interface BusyBlock {
    startTime: Date;
    endTime: Date;
  }

  const busyBlocks: BusyBlock[] = [];

  for (const e of regularEvents) {
    busyBlocks.push({ startTime: e.startTime, endTime: e.endTime });
  }

  for (const master of recurringMasters) {
    if (!master.rrule) continue;
    const dur = differenceInMinutes(master.endTime, master.startTime);
    const excludedDates = parseExDates(master.exDates);

    const occurrences = expandRecurrence(
      master.rrule,
      master.startTime,
      dur,
      dayStart,
      nextDayStart
    );

    for (const occ of occurrences) {
      if (excludedDates.has(dateKey(occ.startTime))) continue;
      busyBlocks.push({ startTime: occ.startTime, endTime: occ.endTime });
    }
  }

  const effectiveBuffer = Math.max(config.bufferMinutes, pageBufferMinutes);

  // Generate candidate slots every 15 minutes
  const STEP = 15;
  const slots: TimeSlot[] = [];

  for (
    let startMins = workingStartMins;
    startMins + duration <= workingEndMins;
    startMins += STEP
  ) {
    const slotStart = new Date(dayDate);
    slotStart.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);

    const slotEnd = addMinutes(slotStart, duration);

    // Skip slots in the past
    if (slotEnd < now) continue;

    // Check overlap with busy blocks (including buffer)
    let isFree = true;
    for (const block of busyBlocks) {
      const bufMs = effectiveBuffer * 60 * 1000;
      const expandedStart = new Date(block.startTime.getTime() - bufMs);
      const expandedEnd = new Date(block.endTime.getTime() + bufMs);

      if (eventsOverlap(slotStart, slotEnd, expandedStart, expandedEnd)) {
        isFree = false;
        break;
      }
    }

    if (isFree) {
      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
      });
    }
  }

  return slots;
}
