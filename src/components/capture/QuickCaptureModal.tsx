"use client";

import { useState, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCalendars } from "@/hooks/useCalendars";
import { useCreateEvent } from "@/hooks/useEvents";
import { useCreateTask } from "@/hooks/useTasks";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { format } from "date-fns";

type CaptureType = "event" | "task";

export function QuickCaptureModal() {
  const isOpen = useUIStore((s) => s.quickCaptureOpen);
  const close = useUIStore((s) => s.closeQuickCapture);
  const timezone = useCalendarViewStore((s) => s.timezone);

  const { data: calendars } = useCalendars();
  const createEvent = useCreateEvent();
  const createTask = useCreateTask();

  const [type, setType] = useState<CaptureType>("event");
  const [title, setTitle] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState("normal");
  const titleRef = useRef<HTMLInputElement>(null);

  const calList = calendars ?? [];

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setType("event");
      setPriority("normal");
      // Default times: next hour, 1-hour duration
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      setStartTime(format(now, "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(end, "yyyy-MM-dd'T'HH:mm"));
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!calendarId && calList.length > 0) {
      const defaultCal = calList.find((c) => c.isDefault) ?? calList[0];
      setCalendarId(defaultCal.id);
    }
  }, [calList, calendarId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !calendarId) return;

    if (type === "event") {
      if (!startTime || !endTime) return;
      createEvent.mutate(
        {
          title: title.trim(),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          calendarId,
          timezone,
        },
        {
          onSuccess: () => {
            toast.success("Event created");
            close();
          },
        }
      );
    } else {
      createTask.mutate(
        {
          title: title.trim(),
          calendarId,
          priority: priority as "low" | "normal" | "high" | "urgent",
          status: "todo",
        },
        {
          onSuccess: () => {
            toast.success("Task created");
            close();
          },
        }
      );
    }
  }

  if (!isOpen) return null;

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]";

  const isSubmitting = createEvent.isPending || createTask.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={close}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[var(--bg-primary)] rounded-xl shadow-2xl border border-[var(--border-primary)] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type toggle */}
          <div className="flex items-center bg-[var(--bg-secondary)] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setType("event")}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-all ${
                type === "event"
                  ? "bg-white shadow-sm font-medium text-[var(--pink-deep)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Event
            </button>
            <button
              type="button"
              onClick={() => setType("task")}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-all ${
                type === "task"
                  ? "bg-white shadow-sm font-medium text-[var(--pink-deep)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Task
            </button>
          </div>

          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "event" ? "Event title..." : "Task title..."}
            className={`${inputClass} text-base font-medium`}
          />

          {/* Event-specific fields */}
          {type === "event" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-[var(--text-tertiary)] mb-0.5">Start</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[var(--text-tertiary)] mb-0.5">End</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Task-specific: priority */}
          {type === "task" && (
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={inputClass}
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          )}

          {/* Calendar */}
          <select
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            className={inputClass}
          >
            {calList.map((cal) => (
              <option key={cal.id} value={cal.id}>{cal.name}</option>
            ))}
          </select>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : `Create ${type === "event" ? "Event" : "Task"}`}
            </Button>
          </div>
        </form>

        <div className="mt-2 text-center text-[10px] text-[var(--text-tertiary)]">
          Press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)]">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
