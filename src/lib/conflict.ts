import type { EventOccurrence } from "@/types/event";
import { eventsOverlap } from "./dates";

export interface ConflictResult {
  event: EventOccurrence;
  isBufferConflict: boolean;
  isFocusConflict: boolean;
}

export function detectConflicts(
  candidateStart: Date,
  candidateEnd: Date,
  existingEvents: EventOccurrence[],
  excludeEventId?: string,
  bufferMinutes?: number
): ConflictResult[] {
  const results: ConflictResult[] = [];

  for (const event of existingEvents) {
    if (event.id === excludeEventId) continue;
    if (event.isAllDay) continue;

    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    // Direct overlap (no buffer)
    if (eventsOverlap(candidateStart, candidateEnd, eventStart, eventEnd)) {
      const isFocus = (event as EventOccurrence & { isFocusTime?: boolean }).isFocusTime ?? false;
      results.push({ event, isBufferConflict: false, isFocusConflict: isFocus });
      continue;
    }

    // Buffer overlap check
    if (bufferMinutes && bufferMinutes > 0) {
      const bufferMs = bufferMinutes * 60 * 1000;
      const expandedStart = new Date(eventStart.getTime() - bufferMs);
      const expandedEnd = new Date(eventEnd.getTime() + bufferMs);

      if (eventsOverlap(candidateStart, candidateEnd, expandedStart, expandedEnd)) {
        results.push({ event, isBufferConflict: true, isFocusConflict: false });
      }
    }
  }

  return results;
}

// Legacy compat: returns just the events array (no buffer info)
export function detectConflictsSimple(
  candidateStart: Date,
  candidateEnd: Date,
  existingEvents: EventOccurrence[],
  excludeEventId?: string
): EventOccurrence[] {
  return detectConflicts(candidateStart, candidateEnd, existingEvents, excludeEventId)
    .map((r) => r.event);
}
