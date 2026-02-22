"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useCreateSchedulingPage, useUpdateSchedulingPage } from "@/hooks/useSchedulingPages";
import { useCalendars } from "@/hooks/useCalendars";
import { toast } from "sonner";
import type { SchedulingPage } from "@/types/scheduling";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

interface Props {
  page?: SchedulingPage;
  onClose: () => void;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "meeting";
}

export function SchedulingPageForm({ page, onClose }: Props) {
  const create = useCreateSchedulingPage();
  const update = useUpdateSchedulingPage();
  const { data: calendars } = useCalendars();
  const isEditing = !!page;

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [description, setDescription] = useState(page?.description ?? "");
  const [durations, setDurations] = useState<number[]>(page?.durations ?? [30]);
  const [bufferMinutes, setBufferMinutes] = useState(page?.bufferMinutes ?? 0);
  const [daysInAdvance, setDaysInAdvance] = useState(page?.daysInAdvance ?? 14);
  const [timezone, setTimezone] = useState(
    page?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"
  );
  const [isActive, setIsActive] = useState(page?.isActive ?? true);
  const [calendarId, setCalendarId] = useState<string>(page?.calendarId ?? "");
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!isEditing && !slugEdited && title) {
      setSlug(generateSlug(title));
    }
  }, [title, isEditing, slugEdited]);

  function toggleDuration(d: number) {
    setDurations((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || durations.length === 0 || !timezone || !calendarId) return;

    const data = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      durations,
      bufferMinutes,
      daysInAdvance,
      timezone,
      isActive,
      calendarId: calendarId || null,
    };

    if (isEditing && page) {
      update.mutate(
        { id: page.id, data },
        {
          onSuccess: () => {
            toast.success("Scheduling page updated");
            onClose();
          },
          onError: (err) => toast.error(err.message),
        }
      );
    } else {
      create.mutate(data, {
        onSuccess: () => {
          toast.success("Scheduling page created");
          onClose();
        },
        onError: (err) => toast.error(err.message),
      });
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Page Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 30-min Intro Call"
          required
          className={`${inputClass} font-medium`}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Calendar *
        </label>
        <select
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">— Select a calendar —</option>
          {calendars?.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.name}
            </option>
          ))}
        </select>
        {calendarId && calendars && (
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Uses this calendar&apos;s working hours &amp; days. Available slots exclude events from all calendars.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          URL Slug
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--text-tertiary)]">/book/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              setSlugEdited(true);
            }}
            placeholder="my-meeting"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What's this meeting for?"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
          Duration Options *
        </label>
        <div className="flex gap-2 flex-wrap">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDuration(d)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                durations.includes(d)
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)] font-medium"
                  : "border-[var(--border-primary)] hover:border-[var(--accent)]"
              }`}
            >
              {d < 60 ? `${d}m` : `${d / 60}h`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Buffer Between Meetings
          </label>
          <select value={bufferMinutes} onChange={(e) => setBufferMinutes(Number(e.target.value))} className={inputClass}>
            <option value={0}>None</option>
            <option value={5}>5 min</option>
            <option value={10}>10 min</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Days in Advance
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={60}
              value={daysInAdvance}
              onChange={(e) => {
                const v = Math.max(1, Math.min(60, Number(e.target.value) || 1));
                setDaysInAdvance(v);
              }}
              className={inputClass}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)] pointer-events-none">
              days
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Timezone
        </label>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-[var(--text-secondary)]">Allow guests to book through this page</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-6 rounded-full border border-[var(--border-primary)] bg-[var(--bg-tertiary)] peer-checked:bg-[var(--accent,#ec4899)] peer-checked:border-[var(--accent,#ec4899)] transition-all relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-4" />
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-primary)]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !title.trim() || durations.length === 0 || !calendarId}>
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Page"}
        </Button>
      </div>
    </form>
  );
}
