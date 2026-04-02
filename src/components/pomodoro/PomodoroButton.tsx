"use client";

import { useEffect, useRef } from "react";
import { usePomodoroStore } from "@/stores/pomodoroStore";

const RADIUS = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PomodoroButton() {
  const { phase, secondsLeft, totalSeconds, isRunning, startWork, togglePause, reset } =
    usePomodoroStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tick = usePomodoroStore((s) => s.tick);

  // Request permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Tick interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const isWork = phase === "work";
  const isBreak = phase === "break";
  const ringColor = isBreak ? "#22c55e" : "#ef4444";
  const emoji = isBreak ? "🌿" : "🍅";

  function handleClick() {
    if (phase === "idle") {
      startWork();
    } else {
      togglePause();
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="relative flex items-center">
        <button
          onClick={handleClick}
          className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/40 transition-colors"
          aria-label={
            phase === "idle"
              ? "Start Pomodoro"
              : isRunning
              ? "Pause Pomodoro"
              : "Resume Pomodoro"
          }
          title={
            phase === "idle"
              ? "Start Pomodoro (25 min)"
              : isRunning
              ? "Pause"
              : "Resume"
          }
        >
          {/* SVG progress ring */}
          {phase !== "idle" && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 36 36"
            >
              {/* Track */}
              <circle
                cx="18"
                cy="18"
                r={RADIUS}
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="2.5"
              />
              {/* Progress */}
              <circle
                cx="18"
                cy="18"
                r={RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth="2.5"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s linear" }}
              />
            </svg>
          )}
          <span className="text-base leading-none select-none relative z-10">
            {emoji}
          </span>
        </button>

        {/* Pause indicator overlay */}
        {phase !== "idle" && !isRunning && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-yellow-400 border border-white" />
        )}
      </div>

      {/* Countdown label */}
      {phase !== "idle" && (
        <div className="flex items-center gap-1">
          <span
            className="text-xs font-mono font-medium tabular-nums"
            style={{ color: isBreak ? "#16a34a" : "#dc2626" }}
          >
            {formatTime(secondsLeft)}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            {isBreak ? "break" : "focus"}
          </span>
        </div>
      )}

      {/* Reset button — only when not idle */}
      {phase !== "idle" && (
        <button
          onClick={reset}
          className="text-[10px] px-1 py-0.5 rounded hover:bg-white/40 transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Reset Pomodoro"
          title="Reset"
        >
          ✕
        </button>
      )}
    </div>
  );
}
