export interface DateRange {
  start: Date;
  end: Date;
}

export type CalendarView = "day" | "week" | "month" | "list";

export interface TimeSlot {
  date: Date;
  hour: number;
  minute: number;
}

export interface LayoutedEvent {
  id: string;
  column: number;
  totalColumns: number;
}
