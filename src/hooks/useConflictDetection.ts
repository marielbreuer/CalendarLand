"use client";

import { useMemo } from "react";
import { detectConflictsSimple } from "@/lib/conflict";
import type { EventOccurrence } from "@/types/event";

export function useConflictDetection(
  startTime: string | null,
  endTime: string | null,
  allEvents: EventOccurrence[],
  excludeEventId?: string
): EventOccurrence[] {
  return useMemo(() => {
    if (!startTime || !endTime) return [];

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    if (end <= start) return [];

    return detectConflictsSimple(start, end, allEvents, excludeEventId);
  }, [startTime, endTime, allEvents, excludeEventId]);
}
