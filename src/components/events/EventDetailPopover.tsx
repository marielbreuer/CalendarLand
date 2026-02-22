"use client";

import { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useDeleteEvent } from "@/hooks/useEvents";
import { useSettings } from "@/hooks/useSettings";
import { RecurrenceScopeDialog } from "./RecurrenceScopeDialog";
import { Button } from "@/components/ui/Button";
import { format } from "@/lib/dates";
import { getEventBgColor } from "@/lib/colors";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import type { RecurrenceScope } from "@/types/event";

interface EventDetailPopoverProps {
  calendarColors: Record<string, string>;
}

export function EventDetailPopover({ calendarColors }: EventDetailPopoverProps) {
  const popoverEvent = useUIStore((s) => s.popoverEvent);
  const popoverPosition = useUIStore((s) => s.popoverPosition);
  const closePopover = useUIStore((s) => s.closePopover);
  const openEditEventModal = useUIStore((s) => s.openEditEventModal);
  const deleteEvent = useDeleteEvent();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const { data: settings } = useSettings();
  const secondaryTz = settings?.secondaryTimezone || null;

  // Close on click outside (but not when scope dialog is open)
  useEffect(() => {
    if (!popoverEvent) return;
    function handleClick(e: MouseEvent) {
      if (scopeDialogOpen) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closePopover();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (scopeDialogOpen) return;
        closePopover();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (scopeDialogOpen) return;
        e.preventDefault();
        handleDelete();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popoverEvent, closePopover, scopeDialogOpen]);

  if (!popoverEvent || !popoverPosition) return null;

  const event = popoverEvent;
  const color = calendarColors[event.calendarId] || "#ec4899";
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  // Position: keep within viewport
  const popWidth = 300;
  const popHeight = 240;
  let left = popoverPosition.x;
  let top = popoverPosition.y + 8;

  if (typeof window !== "undefined") {
    if (left + popWidth > window.innerWidth - 16) {
      left = window.innerWidth - popWidth - 16;
    }
    if (left < 16) left = 16;
    if (top + popHeight > window.innerHeight - 16) {
      top = popoverPosition.y - popHeight - 8;
    }
    if (top < 16) top = 16;
  }

  function handleEdit() {
    const targetId = event.isVirtual && event.masterEventId
      ? event.masterEventId
      : event.id;
    openEditEventModal(targetId, {
      occurrenceDate: event.occurrenceDate,
      isRecurring: event.isRecurring,
      masterEventId: event.masterEventId,
    });
  }

  function handleDelete() {
    if (event.isRecurring) {
      setScopeDialogOpen(true);
      return;
    }
    deleteEvent.mutate(
      { id: event.id },
      {
        onSuccess: () => {
          toast.success("Event deleted");
          closePopover();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleScopeDelete(scope: RecurrenceScope) {
    const eventId = event.masterEventId || event.id;
    deleteEvent.mutate(
      {
        id: eventId,
        scope,
        occurrenceDate: event.occurrenceDate,
      },
      {
        onSuccess: () => {
          toast.success("Event deleted");
          setScopeDialogOpen(false);
          closePopover();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <>
      <div
        ref={popoverRef}
        className="fixed z-50 shadow-2xl rounded-2xl border border-[var(--border-primary)] glass-card overflow-hidden"
        style={{ left, top, width: popWidth }}
      >
        {/* Color bar */}
        <div className="h-2" style={{ backgroundColor: color }} />

        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight">
              {event.title}
            </h3>
            <button
              onClick={closePopover}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0 mt-0.5"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Time */}
          <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <span>
                {event.isAllDay
                  ? format(start, "EEEE, MMM d, yyyy")
                  : `${format(start, "EEE, MMM d")} · ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`}
              </span>
              {!event.isAllDay && secondaryTz && (() => {
                try {
                  const secStart = formatInTimeZone(start, secondaryTz, "h:mm a");
                  const secEnd = formatInTimeZone(end, secondaryTz, "h:mm a");
                  const tzShort = new Intl.DateTimeFormat("en-US", {
                    timeZone: secondaryTz,
                    timeZoneName: "short",
                  }).formatToParts(start).find((p) => p.type === "timeZoneName")?.value ?? secondaryTz;
                  return (
                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {secStart} – {secEnd} {tzShort}
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                <path d="M7 1C4.79 1 3 2.79 3 5c0 3.5 4 7.5 4 7.5s4-4 4-7.5c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor" />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Description preview */}
          {event.description && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Recurring badge */}
          {event.isRecurring && (
            <span
              className="inline-block text-[10px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: getEventBgColor(color, 0.15),
                color,
              }}
            >
              Recurring
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-primary)]">
            <Button variant="primary" size="sm" onClick={handleEdit}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <RecurrenceScopeDialog
        open={scopeDialogOpen}
        action="delete"
        onSelect={handleScopeDelete}
        onCancel={() => setScopeDialogOpen(false)}
      />
    </>
  );
}
