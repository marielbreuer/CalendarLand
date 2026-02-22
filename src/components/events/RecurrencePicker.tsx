"use client";

import { useState, useEffect } from "react";
import { getPresetRRule, describeRRule } from "@/lib/recurrence";

interface RecurrencePickerProps {
  value: string | null;
  onChange: (rrule: string | null) => void;
  dayOfWeek: number;
}

const PRESETS = [
  { label: "Does not repeat", value: "none" },
  { label: "Every day", value: "daily" },
  { label: "Every week", value: "weekly" },
  { label: "Every 2 weeks", value: "biweekly" },
  { label: "Every month", value: "monthly" },
  { label: "Every year", value: "yearly" },
  { label: "Custom...", value: "custom" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function RecurrencePicker({
  value,
  onChange,
  dayOfWeek,
}: RecurrencePickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [interval, setInterval] = useState(1);
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("WEEKLY");
  const [selectedDays, setSelectedDays] = useState<number[]>([dayOfWeek]);
  const [endType, setEndType] = useState<"never" | "count" | "until">("never");
  const [count, setCount] = useState(10);
  const [until, setUntil] = useState("");

  function getSelectedPreset(): string {
    if (!value) return "none";
    if (value === "FREQ=DAILY") return "daily";
    if (value.startsWith("FREQ=WEEKLY") && !value.includes("INTERVAL=2") && !value.includes("INTERVAL=3")) return "weekly";
    if (value.includes("INTERVAL=2") && value.startsWith("FREQ=WEEKLY")) return "biweekly";
    if (value === "FREQ=MONTHLY") return "monthly";
    if (value === "FREQ=YEARLY") return "yearly";
    return "custom";
  }

  function handlePresetChange(preset: string) {
    if (preset === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange(getPresetRRule(preset, dayOfWeek));
  }

  function buildCustomRRule() {
    let rule = `FREQ=${frequency};INTERVAL=${interval}`;
    if (frequency === "WEEKLY" && selectedDays.length > 0) {
      const dayNames = selectedDays.map((d) => ["MO", "TU", "WE", "TH", "FR", "SA", "SU"][d]);
      rule += `;BYDAY=${dayNames.join(",")}`;
    }
    if (endType === "count") rule += `;COUNT=${count}`;
    if (endType === "until" && until) rule += `;UNTIL=${until.replace(/-/g, "")}T235959Z`;
    return rule;
  }

  function handleCustomSave() {
    onChange(buildCustomRRule());
    setShowCustom(false);
  }

  function toggleDay(dayIdx: number) {
    setSelectedDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx]
    );
  }

  return (
    <div className="space-y-2">
      <select
        value={getSelectedPreset()}
        onChange={(e) => handlePresetChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]"
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {value && !showCustom && (
        <p className="text-xs text-[var(--text-secondary)]">
          {describeRRule(value)}
        </p>
      )}

      {showCustom && (
        <div className="p-3 border border-[var(--border-primary)] rounded-lg space-y-3 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <span className="text-sm">Every</span>
            <input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm text-center"
            />
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              className="px-2 py-1 rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm"
            >
              <option value="DAILY">day(s)</option>
              <option value="WEEKLY">week(s)</option>
              <option value="MONTHLY">month(s)</option>
              <option value="YEARLY">year(s)</option>
            </select>
          </div>

          {frequency === "WEEKLY" && (
            <div className="flex gap-1">
              {DAYS.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                    selectedDays.includes(idx)
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <span className="text-sm font-medium">Ends</span>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={endType === "never"}
                  onChange={() => setEndType("never")}
                />
                Never
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={endType === "count"}
                  onChange={() => setEndType("count")}
                />
                After
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-0.5 rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm text-center"
                  disabled={endType !== "count"}
                />
                occurrences
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={endType === "until"}
                  onChange={() => setEndType("until")}
                />
                On
                <input
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className="px-2 py-0.5 rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm"
                  disabled={endType !== "until"}
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCustomSave}
            className="w-full py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
