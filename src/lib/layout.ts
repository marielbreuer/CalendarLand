import type { EventOccurrence } from "@/types/event";

interface LayoutedEvent {
  event: EventOccurrence;
  column: number;
  totalColumns: number;
}

export function layoutOverlappingEvents(
  events: EventOccurrence[]
): LayoutedEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => {
    const aStart = new Date(a.startTime).getTime();
    const bStart = new Date(b.startTime).getTime();
    if (aStart !== bStart) return aStart - bStart;
    const aDur =
      new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
    const bDur =
      new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
    return bDur - aDur;
  });

  const groups: EventOccurrence[][] = [];
  let currentGroup: EventOccurrence[] = [];
  let groupEnd = 0;

  for (const event of sorted) {
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();

    if (currentGroup.length === 0 || start < groupEnd) {
      currentGroup.push(event);
      groupEnd = Math.max(groupEnd, end);
    } else {
      groups.push(currentGroup);
      currentGroup = [event];
      groupEnd = end;
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  const result: LayoutedEvent[] = [];

  for (const group of groups) {
    const columns: EventOccurrence[][] = [];

    for (const event of group) {
      const eventStart = new Date(event.startTime).getTime();
      let placed = false;

      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        const lastEnd = new Date(lastInCol.endTime).getTime();

        if (eventStart >= lastEnd) {
          columns[col].push(event);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([event]);
      }
    }

    const totalColumns = columns.length;
    for (let col = 0; col < columns.length; col++) {
      for (const event of columns[col]) {
        result.push({ event, column: col, totalColumns });
      }
    }
  }

  return result;
}
