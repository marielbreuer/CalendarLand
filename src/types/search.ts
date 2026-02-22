import type { Event } from "./event";
import type { Task } from "./task";

export interface SearchFilters {
  query: string;
  type?: "events" | "tasks" | "all";
  calendarIds?: string[];
}

export interface SearchResults {
  events: Event[];
  tasks: Task[];
}
