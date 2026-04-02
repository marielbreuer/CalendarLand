"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/stores/uiStore";
import {
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useTimeEntries,
} from "@/hooks/useTimeEntries";
import { useCalendars } from "@/hooks/useCalendars";
import { toast } from "sonner";
import { format } from "date-fns";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(s: string): string {
  return new Date(s).toISOString();
}

export function TimeEntryModal() {
  const open = useUIStore((s) => s.timeEntryModalOpen);
  const mode = useUIStore((s) => s.timeEntryModalMode);
  const selectedId = useUIStore((s) => s.selectedTimeEntryId);
  const prefill = useUIStore((s) => s.timeEntryPrefill);
  const closeModal = useUIStore((s) => s.closeTimeEntryModal);

  const { data: calendarsData } = useCalendars();
  const { data: entriesData } = useTimeEntries(selectedId ? {} : {});
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();

  const calendars = calendarsData ?? [];
  const existingEntry = selectedId
    ? (entriesData?.timeEntries ?? []).find((e) => e.id === selectedId)
    : null;

  const now = new Date();
  const defaultStart = toDatetimeLocal(now.toISOString());

  const [description, setDescription] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [startedAt, setStartedAt] = useState(defaultStart);
  const [endedAt, setEndedAt] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    if (mode === "edit" && existingEntry) {
      setDescription(existingEntry.description ?? "");
      setCalendarId(existingEntry.calendarId);
      setStartedAt(toDatetimeLocal(existingEntry.startedAt));
      setEndedAt(existingEntry.endedAt ? toDatetimeLocal(existingEntry.endedAt) : "");
      setIsBillable(existingEntry.isBillable);
    } else {
      setDescription("");
      setCalendarId(prefill?.calendarId ?? calendars[0]?.id ?? "");
      setStartedAt(defaultStart);
      setEndedAt("");
      setIsBillable(false);
    }
  }, [open, mode, existingEntry, prefill, calendars]);

  function computedDuration(): string {
    if (!startedAt || !endedAt) return "";
    const diff = Math.round(
      (new Date(fromDatetimeLocal(endedAt)).getTime() -
        new Date(fromDatetimeLocal(startedAt)).getTime()) /
        60000
    );
    if (diff <= 0) return "";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function handleSubmit() {
    if (!calendarId) {
      toast.error("Select a calendar");
      return;
    }
    if (!startedAt) {
      toast.error("Start time is required");
      return;
    }

    const payload = {
      description: description || undefined,
      calendarId,
      startedAt: fromDatetimeLocal(startedAt),
      endedAt: endedAt ? fromDatetimeLocal(endedAt) : undefined,
      isBillable,
      ...(prefill?.eventId ? { eventId: prefill.eventId } : {}),
      ...(prefill?.taskId ? { taskId: prefill.taskId } : {}),
    };

    if (mode === "edit" && selectedId) {
      updateEntry.mutate(
        { id: selectedId, data: payload },
        {
          onSuccess: () => { toast.success("Time entry updated"); closeModal(); },
          onError: (err) => toast.error(err.message),
        }
      );
    } else {
      createEntry.mutate(payload, {
        onSuccess: () => { toast.success("Time entry logged"); closeModal(); },
        onError: (err) => toast.error(err.message),
      });
    }
  }

  function handleDelete() {
    if (!selectedId) return;
    deleteEntry.mutate(selectedId, {
      onSuccess: () => { toast.success("Entry deleted"); closeModal(); },
      onError: (err) => toast.error(err.message),
    });
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";

  const duration = computedDuration();
  const isPending = createEntry.isPending || updateEntry.isPending;

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={mode === "edit" ? "Edit Time Entry" : "Log Time"}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What were you working on?"
            className={inputClass}
          />
        </div>

        {/* Calendar */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Calendar</label>
          <select
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select calendar…</option>
            {calendars.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Start / End */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Start</label>
            <input
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">End</label>
            <input
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Duration display */}
        {duration && (
          <p className="text-xs text-[var(--text-secondary)]">
            Duration: <span className="font-medium text-[var(--text-primary)]">{duration}</span>
          </p>
        )}

        {/* Billable toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            role="switch"
            aria-checked={isBillable}
            onClick={() => setIsBillable((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] ${
              isBillable ? "bg-[var(--accent,#ec4899)]" : "bg-[var(--border-primary)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                isBillable ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm">Billable</span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving…" : mode === "edit" ? "Save" : "Log Time"}
            </Button>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </div>
          {mode === "edit" && selectedId && (
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500">Delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleteEntry.isPending}
                    className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
