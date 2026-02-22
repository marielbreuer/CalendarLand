"use client";

import { useState, useRef, useEffect } from "react";
import { REMINDER_PRESETS, type Reminder } from "@/types/notification";
import { reminderLabel } from "@/lib/reminder-utils";

interface ReminderPickerProps {
  value: Reminder[];
  onChange: (reminders: Reminder[]) => void;
}

export function ReminderPicker({ value, onChange }: ReminderPickerProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedMinutes = new Set(value.map((r) => r.minutes));
  const availablePresets = REMINDER_PRESETS.filter(
    (p) => !selectedMinutes.has(p.minutes)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addReminder(minutes: number) {
    if (value.length >= 5) return;
    onChange([...value, { minutes }]);
    setOpen(false);
  }

  function removeReminder(minutes: number) {
    onChange(value.filter((r) => r.minutes !== minutes));
  }

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-1">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 1.5a5 5 0 00-5 5v2.5l-1 1.5h12l-1-1.5V6.5a5 5 0 00-5-5zM5.5 11a1.5 1.5 0 003 0"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Reminders
      </label>

      {/* Existing reminder chips */}
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {value
          .sort((a, b) => a.minutes - b.minutes)
          .map((r) => (
            <span
              key={r.minutes}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {reminderLabel(r.minutes)}
              <button
                type="button"
                onClick={() => removeReminder(r.minutes)}
                className="hover:text-blue-600 dark:hover:text-blue-100"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
      </div>

      {/* Add reminder dropdown */}
      {value.length < 5 && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            + Add reminder
          </button>

          {open && availablePresets.length > 0 && (
            <div className="absolute z-20 mt-1 left-0 w-52 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg py-1">
              {availablePresets.map((p) => (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => addReminder(p.minutes)}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
