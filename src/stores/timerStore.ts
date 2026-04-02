import { create } from "zustand";

interface TimerState {
  runningEntryId: string | null;
  runningLabel: string | null;
  calendarId: string | null;
  startedAt: Date | null;
  linkedEventEndTime: Date | null;
  elapsedSeconds: number;

  startTimer: (
    entryId: string,
    label: string,
    startedAt: Date,
    calendarId: string,
    eventEndTime?: Date
  ) => void;
  stopTimer: () => void;
  tickTimer: () => void;
  hydrateFromServer: (entry: {
    id: string;
    description: string | null;
    calendarId: string;
    startedAt: string;
    endedAt: string | null;
  } | null) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  runningEntryId: null,
  runningLabel: null,
  calendarId: null,
  startedAt: null,
  linkedEventEndTime: null,
  elapsedSeconds: 0,

  startTimer: (entryId, label, startedAt, calendarId, eventEndTime) =>
    set({
      runningEntryId: entryId,
      runningLabel: label,
      calendarId,
      startedAt,
      linkedEventEndTime: eventEndTime ?? null,
      elapsedSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
    }),

  stopTimer: () =>
    set({
      runningEntryId: null,
      runningLabel: null,
      calendarId: null,
      startedAt: null,
      linkedEventEndTime: null,
      elapsedSeconds: 0,
    }),

  tickTimer: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),

  hydrateFromServer: (entry) => {
    if (!entry || entry.endedAt !== null) {
      set({
        runningEntryId: null,
        runningLabel: null,
        calendarId: null,
        startedAt: null,
        linkedEventEndTime: null,
        elapsedSeconds: 0,
      });
      return;
    }
    const startedAt = new Date(entry.startedAt);
    set({
      runningEntryId: entry.id,
      runningLabel: entry.description,
      calendarId: entry.calendarId,
      startedAt,
      linkedEventEndTime: null,
      elapsedSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
    });
  },
}));
