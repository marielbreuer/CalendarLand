import { create } from "zustand";

export const WORK_SECONDS = 25 * 60;
export const BREAK_SECONDS = 5 * 60;

type PomodoroPhase = "idle" | "work" | "break";

interface PomodoroState {
  phase: PomodoroPhase;
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  sessionCount: number;

  startWork: () => void;
  startBreak: () => void;
  togglePause: () => void;
  reset: () => void;
  tick: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  phase: "idle",
  secondsLeft: WORK_SECONDS,
  totalSeconds: WORK_SECONDS,
  isRunning: false,
  sessionCount: 0,

  startWork: () =>
    set({
      phase: "work",
      secondsLeft: WORK_SECONDS,
      totalSeconds: WORK_SECONDS,
      isRunning: true,
    }),

  startBreak: () =>
    set({
      phase: "break",
      secondsLeft: BREAK_SECONDS,
      totalSeconds: BREAK_SECONDS,
      isRunning: true,
    }),

  togglePause: () => set((s) => ({ isRunning: !s.isRunning })),

  reset: () =>
    set({
      phase: "idle",
      secondsLeft: WORK_SECONDS,
      totalSeconds: WORK_SECONDS,
      isRunning: false,
      sessionCount: 0,
    }),

  tick: () => {
    const { secondsLeft, phase, sessionCount } = get();
    if (secondsLeft > 1) {
      set({ secondsLeft: secondsLeft - 1 });
      return;
    }
    // Session ended
    if (phase === "work") {
      set({ sessionCount: sessionCount + 1 });
      if (typeof window !== "undefined" && Notification.permission === "granted") {
        new Notification("🍅 Pomodoro complete!", {
          body: "Time for a 5-minute break.",
        });
      }
      get().startBreak();
    } else {
      if (typeof window !== "undefined" && Notification.permission === "granted") {
        new Notification("💪 Break over!", {
          body: "Ready for another focus session?",
        });
      }
      // Auto-start next work session
      get().startWork();
    }
  },
}));
