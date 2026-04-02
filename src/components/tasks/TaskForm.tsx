"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { TagPicker } from "@/components/shared/TagPicker";
import type { Calendar } from "@/types/calendar";
import type { Task, CreateTaskInput, TaskStatus, TaskPriority, TaskDifficulty } from "@/types/task";
import { format } from "date-fns";

interface TaskFormProps {
  mode: "create" | "edit";
  calendars: Calendar[];
  existingTask?: Task;
  onSubmit: (data: CreateTaskInput) => void;
  onDelete?: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const statusOptions: { label: string; value: TaskStatus }[] = [
  { label: "To Do", value: "todo" },
  { label: "Doing", value: "doing" },
  { label: "Done", value: "done" },
];

const priorityOptions: { label: string; value: TaskPriority }[] = [
  { label: "Low", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const difficultyOptions: { label: string; value: TaskDifficulty; color: string; pts: string }[] = [
  { label: "Easy", value: "easy", color: "#22c55e", pts: "1 pt" },
  { label: "Medium", value: "medium", color: "#f59e0b", pts: "2 pts" },
  { label: "Hard", value: "hard", color: "#ef4444", pts: "5 pts" },
];

export function TaskForm({
  mode,
  calendars,
  existingTask,
  onSubmit,
  onDelete,
  onCancel,
  isSubmitting,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [calendarId, setCalendarId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<TaskDifficulty | null>(null);

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description ?? "");
      setDueDate(existingTask.dueDate ? format(new Date(existingTask.dueDate), "yyyy-MM-dd") : "");
      setStatus(existingTask.status);
      setPriority(existingTask.priority);
      setCalendarId(existingTask.calendarId);
      setTags(existingTask.tags ?? []);
      setDifficulty(existingTask.difficulty ?? null);
    }
  }, [existingTask]);

  useEffect(() => {
    if (!calendarId && calendars.length > 0) {
      const defaultCal = calendars.find((c) => c.isDefault) ?? calendars[0];
      setCalendarId(defaultCal.id);
    }
  }, [calendars, calendarId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !calendarId) return;

    onSubmit({
      title: title.trim(),
      description: description || undefined,
      dueDate: dueDate ? new Date(dueDate + "T00:00:00").toISOString() : undefined,
      status,
      priority,
      difficulty: difficulty ?? undefined,
      calendarId,
      tags: tags.length > 0 ? tags : undefined,
    });
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className={`${inputClass} text-lg font-medium`}
        autoFocus
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className={inputClass}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className={inputClass}
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Difficulty <span className="font-normal text-[var(--text-tertiary)]">(optional — awards points on completion)</span>
        </label>
        <div className="flex gap-2">
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDifficulty(difficulty === opt.value ? null : opt.value)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                difficulty === opt.value
                  ? "border-transparent text-white"
                  : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
              }`}
              style={difficulty === opt.value ? { background: opt.color, borderColor: opt.color } : {}}
            >
              {opt.label}
              <span className="ml-1 opacity-70">{opt.pts}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Due Date
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputClass}
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

      <TagPicker value={tags} onChange={setTags} />

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
              ? "Create Task"
              : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}
