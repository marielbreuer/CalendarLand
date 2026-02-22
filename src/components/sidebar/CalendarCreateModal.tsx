"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { useCreateCalendar } from "@/hooks/useCalendars";

interface CalendarCreateModalProps {
  open: boolean;
  onClose: () => void;
}

export function CalendarCreateModal({ open, onClose }: CalendarCreateModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ec4899");
  const createCalendar = useCreateCalendar();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createCalendar.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName("");
          setColor("#ec4899");
          onClose();
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="New Calendar">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Client: Acme Corp"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || createCalendar.isPending}>
            {createCalendar.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
