"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { ParticipantInput } from "./ParticipantInput";
import { RecurrencePicker } from "./RecurrencePicker";
import { TagPicker } from "@/components/shared/TagPicker";
import { ReminderPicker } from "./ReminderPicker";
import { detectConflicts } from "@/lib/conflict";
import { useSettings } from "@/hooks/useSettings";
import { useCalendarViewStore } from "@/stores/calendarViewStore";
import { useTemplates, useCreateTemplate } from "@/hooks/useTemplates";
import { format, getDay } from "date-fns";
import { toast } from "sonner";
import type { Calendar } from "@/types/calendar";
import type { Event, CreateEventInput, EventOccurrence } from "@/types/event";
import type { Reminder } from "@/types/notification";

interface EventFormProps {
  mode: "create" | "edit";
  calendars: Calendar[];
  prefill?: Partial<CreateEventInput>;
  existingEvent?: Event;
  allEvents?: EventOccurrence[];
  onSubmit: (data: CreateEventInput) => void;
  onDelete?: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function toLocalDatetimeString(isoString: string): string {
  const d = new Date(isoString);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function EventForm({
  mode,
  calendars,
  prefill,
  existingEvent,
  allEvents = [],
  onSubmit,
  onDelete,
  onCancel,
  isSubmitting,
}: EventFormProps) {

  const timezone = useCalendarViewStore((s) => s.timezone);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [calendarId, setCalendarId] = useState("");
  const [participants, setParticipants] = useState<{ name: string; email: string }[]>([]);
  const [rrule, setRrule] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isFocusTime, setIsFocusTime] = useState(false);

  const { data: templatesData } = useTemplates();
  const createTemplate = useCreateTemplate();
  const templates = templatesData?.templates ?? [];
  const { data: settingsData } = useSettings();
  const bufferMinutes = settingsData?.bufferMinutes ?? 0;

  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title);
      setDescription(existingEvent.description ?? "");
      setLocation(existingEvent.location ?? "");
      setMeetingLink(existingEvent.meetingLink ?? "");
      setStartTime(toLocalDatetimeString(existingEvent.startTime));
      setEndTime(toLocalDatetimeString(existingEvent.endTime));
      setIsAllDay(existingEvent.isAllDay);
      setCalendarId(existingEvent.calendarId);
      setParticipants(
        existingEvent.participants.map((p) => ({ name: p.name, email: p.email }))
      );
      setRrule(existingEvent.rrule ?? null);
      setTags(existingEvent.tags ?? []);
      setReminders(existingEvent.reminders ?? []);
      setIsFocusTime(existingEvent.isFocusTime ?? false);
    } else if (prefill) {
      if (prefill.startTime) setStartTime(toLocalDatetimeString(prefill.startTime));
      if (prefill.endTime) setEndTime(toLocalDatetimeString(prefill.endTime));
      if (prefill.calendarId) setCalendarId(prefill.calendarId);
    }
  }, [existingEvent, prefill]);

  useEffect(() => {
    if (!calendarId && calendars.length > 0) {
      const defaultCal = calendars.find((c) => c.isDefault) ?? calendars[0];
      setCalendarId(defaultCal.id);
    }
  }, [calendars, calendarId]);

  // When all-day is toggled on, sync end date to start date if end is empty or before start
  useEffect(() => {
    if (isAllDay && startTime) {
      const startDate = startTime.split("T")[0];
      const endDate = endTime.split("T")[0];
      if (!endDate || endDate < startDate) {
        setEndTime(startTime);
      }
    }
  }, [isAllDay, startTime]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startTime || !calendarId) return;

    let finalEndTime = endTime;
    if (isAllDay) {
      // For all-day events, if no end date, use start date; ensure end is end-of-day
      const startDate = startTime.split("T")[0];
      const endDate = finalEndTime ? finalEndTime.split("T")[0] : startDate;
      const resolvedEnd = endDate < startDate ? startDate : endDate;
      finalEndTime = `${resolvedEnd}T23:59`;
      // Also adjust start to beginning of day
      const resolvedStart = `${startDate}T00:00`;
      onSubmit({
        title: title.trim(),
        description: description || undefined,
        location: location || undefined,
        meetingLink: meetingLink || undefined,
        startTime: new Date(resolvedStart).toISOString(),
        endTime: new Date(finalEndTime).toISOString(),
        isAllDay,
        timezone,
        calendarId,
        isRecurring: !!rrule,
        rrule: rrule || undefined,
        participants: isFocusTime ? undefined : (participants.length > 0 ? participants : undefined),
        tags: tags.length > 0 ? tags : undefined,
        reminders: reminders.length > 0 ? reminders : undefined,
        isFocusTime,
      });
      return;
    }

    if (!finalEndTime) return;

    onSubmit({
      title: title.trim(),
      description: description || undefined,
      location: location || undefined,
      meetingLink: meetingLink || undefined,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(finalEndTime).toISOString(),
      isAllDay,
      timezone,
      calendarId,
      isRecurring: !!rrule,
      rrule: rrule || undefined,
      participants: isFocusTime ? undefined : (participants.length > 0 ? participants : undefined),
      tags: tags.length > 0 ? tags : undefined,
      reminders: reminders.length > 0 ? reminders : undefined,
      isFocusTime,
    });
  }

  const conflictResults = useMemo(() => {
    if (!startTime || !endTime || isAllDay) return [];
    const s = new Date(startTime);
    const e = new Date(endTime);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return [];
    return detectConflicts(s, e, allEvents, existingEvent?.id, bufferMinutes);
  }, [startTime, endTime, isAllDay, allEvents, existingEvent?.id, bufferMinutes]);

  const hardConflicts = conflictResults.filter((r) => !r.isBufferConflict);
  const bufferConflicts = conflictResults.filter((r) => r.isBufferConflict);

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Template picker */}
      {templates.length > 0 && mode === "create" && (
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            From Template
          </label>
          <select
            value=""
            onChange={(e) => {
              const tmpl = templates.find((t) => t.id === e.target.value);
              if (!tmpl) return;
              setTitle(tmpl.title);
              setDescription(tmpl.description ?? "");
              setLocation(tmpl.location ?? "");
              setMeetingLink(tmpl.meetingLink ?? "");
              if (tmpl.calendarId) setCalendarId(tmpl.calendarId);
              if (tmpl.tags?.length) setTags(tmpl.tags);
              if (tmpl.participants?.length) setParticipants(tmpl.participants);
              // Apply duration to end time
              if (startTime && tmpl.duration) {
                const start = new Date(startTime);
                const end = new Date(start.getTime() + tmpl.duration * 60 * 1000);
                setEndTime(format(end, "yyyy-MM-dd'T'HH:mm"));
              }
            }}
            className={inputClass}
          >
            <option value="">Choose a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title"
        className={`${inputClass} text-lg font-medium`}
        autoFocus
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Start
          </label>
          <input
            type={isAllDay ? "date" : "datetime-local"}
            value={isAllDay ? startTime.split("T")[0] : startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            End
          </label>
          <input
            type={isAllDay ? "date" : "datetime-local"}
            value={isAllDay ? endTime.split("T")[0] : endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="rounded border-[var(--border-primary)]"
          />
          All day
        </label>
        <span className="text-xs text-[var(--text-secondary)]">
          {timezone}
        </span>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Repeat
        </label>
        <RecurrencePicker
          value={rrule}
          onChange={setRrule}
          dayOfWeek={startTime ? (getDay(new Date(startTime)) + 6) % 7 : 0}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Calendar
        </label>
        <select
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          className={inputClass}
        >
          {calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.name}
            </option>
          ))}
        </select>
      </div>

      {/* Focus Time toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div>
          <p className="text-sm font-medium">Focus Time</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {isFocusTime
              ? "Treated as busy — blocks scheduling link availability"
              : "Mark as a focus block (deep work, no interruptions)"}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
          <input
            type="checkbox"
            checked={isFocusTime}
            onChange={(e) => setIsFocusTime(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-6 rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] peer-checked:bg-[var(--accent,#ec4899)] peer-checked:border-[var(--accent,#ec4899)] transition-all relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-4" />
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Add description..."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location..."
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Meeting Link
          </label>
          <input
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            className={inputClass}
          />
        </div>
      </div>

      {!isFocusTime && (
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Participants
          </label>
          <ParticipantInput value={participants} onChange={setParticipants} />
        </div>
      )}

      <TagPicker value={tags} onChange={setTags} />

      <ReminderPicker value={reminders} onChange={setReminders} />

      {/* Save as template */}
      {mode === "create" && title.trim() && (
        <button
          type="button"
          onClick={() => {
            const duration = startTime && endTime
              ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
              : 60;
            const name = window.prompt("Template name:", title.trim());
            if (!name) return;
            createTemplate.mutate(
              {
                name,
                title: title.trim(),
                description: description || undefined,
                location: location || undefined,
                meetingLink: meetingLink || undefined,
                duration: Math.max(duration, 1),
                calendarId: calendarId || undefined,
                participants: participants.length > 0 ? participants : undefined,
                tags: tags.length > 0 ? tags : undefined,
              },
              { onSuccess: () => toast.success("Template saved") }
            );
          }}
          className="text-xs text-[var(--accent)] hover:underline"
        >
          Save as Template
        </button>
      )}

      {hardConflicts.length > 0 && (
        <div className="rounded-lg border border-red-400/50 bg-red-50 dark:bg-red-900/20 px-3 py-2">
          <p className="text-xs font-medium text-red-800 dark:text-red-300">
            Time conflict with {hardConflicts.length} event{hardConflicts.length > 1 ? "s" : ""}:
          </p>
          <ul className="mt-1 space-y-0.5">
            {hardConflicts.slice(0, 3).map((r) => (
              <li key={r.event.id + r.event.occurrenceDate} className="text-xs text-red-700 dark:text-red-400 truncate">
                {r.isFocusConflict && "🎯 "}
                {r.event.title} ({format(new Date(r.event.startTime), "h:mm a")} &ndash; {format(new Date(r.event.endTime), "h:mm a")})
                {r.isFocusConflict && " (focus block)"}
              </li>
            ))}
            {hardConflicts.length > 3 && (
              <li className="text-xs text-red-600 dark:text-red-500">
                and {hardConflicts.length - 3} more...
              </li>
            )}
          </ul>
        </div>
      )}

      {bufferConflicts.length > 0 && bufferMinutes > 0 && (
        <div className="rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
            Within {bufferMinutes}-min buffer of {bufferConflicts.length} event{bufferConflicts.length > 1 ? "s" : ""}:
          </p>
          <ul className="mt-1 space-y-0.5">
            {bufferConflicts.slice(0, 3).map((r) => (
              <li key={r.event.id + r.event.occurrenceDate} className="text-xs text-amber-700 dark:text-amber-400 truncate">
                {r.event.title} ({format(new Date(r.event.startTime), "h:mm a")} &ndash; {format(new Date(r.event.endTime), "h:mm a")})
              </li>
            ))}
            {bufferConflicts.length > 3 && (
              <li className="text-xs text-amber-600 dark:text-amber-500">
                and {bufferConflicts.length - 3} more...
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)]">
        <div>
          {onDelete && (
            <Button type="button" variant="danger" size="sm" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
              ? "Create"
              : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}
