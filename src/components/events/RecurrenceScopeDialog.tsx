"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { RecurrenceScope } from "@/types/event";

interface RecurrenceScopeDialogProps {
  open: boolean;
  action: "edit" | "delete";
  onSelect: (scope: RecurrenceScope) => void;
  onCancel: () => void;
}

export function RecurrenceScopeDialog({
  open,
  action,
  onSelect,
  onCancel,
}: RecurrenceScopeDialogProps) {
  const title = action === "edit" ? "Edit recurring event" : "Delete recurring event";

  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-sm">
      <div className="space-y-2">
        <button
          onClick={() => onSelect("single")}
          className="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <div className="text-sm font-medium">This event</div>
          <div className="text-xs text-[var(--text-tertiary)]">
            Only {action} this occurrence
          </div>
        </button>
        <button
          onClick={() => onSelect("future")}
          className="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <div className="text-sm font-medium">This and following events</div>
          <div className="text-xs text-[var(--text-tertiary)]">
            {action === "edit" ? "Edit" : "Delete"} this and all future occurrences
          </div>
        </button>
        <button
          onClick={() => onSelect("all")}
          className="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <div className="text-sm font-medium">All events</div>
          <div className="text-xs text-[var(--text-tertiary)]">
            {action === "edit" ? "Edit" : "Delete"} all occurrences in the series
          </div>
        </button>
        <div className="pt-2 border-t border-[var(--border-primary)]">
          <Button variant="secondary" size="sm" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
