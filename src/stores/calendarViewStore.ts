import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalendarView } from "@/types/common";
import { navigateDate } from "@/lib/dates";

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

interface CalendarViewState {
  view: CalendarView;
  selectedDate: Date;
  timezone: string;
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  setTimezone: (tz: string) => void;
  goToToday: () => void;
  goForward: () => void;
  goBackward: () => void;
}

export const useCalendarViewStore = create<CalendarViewState>()(
  persist(
    (set, get) => ({
      view: "week",
      selectedDate: new Date(),
      timezone: detectTimezone(),
      setView: (view) => set({ view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setTimezone: (tz) => set({ timezone: tz }),
      goToToday: () => set({ selectedDate: new Date() }),
      goForward: () => {
        const { selectedDate, view } = get();
        set({ selectedDate: navigateDate(selectedDate, view, "forward") });
      },
      goBackward: () => {
        const { selectedDate, view } = get();
        set({ selectedDate: navigateDate(selectedDate, view, "backward") });
      },
    }),
    {
      name: "calendar-view-store",
      partialize: (state) => ({ timezone: state.timezone }),
    }
  )
);
