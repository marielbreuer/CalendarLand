"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useSearch } from "@/hooks/useSearch";
import { format } from "date-fns";

export function SearchModal() {
  const isOpen = useUIStore((s) => s.searchModalOpen);
  const closeSearch = useUIStore((s) => s.closeSearchModal);
  const openEditEventModal = useUIStore((s) => s.openEditEventModal);
  const openEditTaskModal = useUIStore((s) => s.openEditTaskModal);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useSearch({ query: debouncedQuery });

  const events = data?.events ?? [];
  const tasks = data?.tasks ?? [];

  type ResultItem =
    | { type: "event"; id: string; title: string; date: string; tags: string[] }
    | { type: "task"; id: string; title: string; status: string; tags: string[] };

  const results: ResultItem[] = [
    ...events.map((e) => ({
      type: "event" as const,
      id: e.id,
      title: e.title,
      date: e.startTime,
      tags: e.tags ?? [],
    })),
    ...tasks.map((t) => ({
      type: "task" as const,
      id: t.id,
      title: t.title,
      status: t.status,
      tags: t.tags ?? [],
    })),
  ];

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  const selectResult = useCallback(
    (item: ResultItem) => {
      if (item.type === "event") {
        openEditEventModal(item.id);
      } else {
        openEditTaskModal(item.id);
      }
      closeSearch();
    },
    [openEditEventModal, openEditTaskModal, closeSearch]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      selectResult(results[selectedIndex]);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={closeSearch}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-[var(--bg-primary)] rounded-xl shadow-2xl border border-[var(--border-primary)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[var(--text-tertiary)] flex-shrink-0">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search events and tasks..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-auto">
          {isLoading && debouncedQuery.length >= 2 && (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">
              Searching...
            </div>
          )}

          {!isLoading && debouncedQuery.length >= 2 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {debouncedQuery.length < 2 && (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">
              Type at least 2 characters to search
            </div>
          )}

          {/* Events section */}
          {events.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-secondary)]">
                Events ({events.length})
              </div>
              {events.map((event, i) => {
                const idx = i;
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={event.id}
                    onClick={() =>
                      selectResult({
                        type: "event",
                        id: event.id,
                        title: event.title,
                        date: event.startTime,
                        tags: event.tags ?? [],
                      })
                    }
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                      isSelected
                        ? "bg-[var(--accent)]/10"
                        : "hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-tertiary)] flex-shrink-0">
                      <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M1 5.5h12" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{event.title}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">
                        {format(new Date(event.startTime), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                    {(event.tags ?? []).length > 0 && (
                      <div className="flex gap-1">
                        {(event.tags ?? []).slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tasks section */}
          {tasks.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-secondary)]">
                Tasks ({tasks.length})
              </div>
              {tasks.map((task, i) => {
                const idx = events.length + i;
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={task.id}
                    onClick={() =>
                      selectResult({
                        type: "task",
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        tags: task.tags ?? [],
                      })
                    }
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                      isSelected
                        ? "bg-[var(--accent)]/10"
                        : "hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-tertiary)] flex-shrink-0">
                      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                      {task.status === "done" && (
                        <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${task.status === "done" ? "line-through text-[var(--text-tertiary)]" : ""}`}>
                        {task.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] capitalize">
                        {task.status === "todo" ? "To Do" : task.status === "doing" ? "In Progress" : "Done"}
                      </div>
                    </div>
                    {(task.tags ?? []).length > 0 && (
                      <div className="flex gap-1">
                        {(task.tags ?? []).slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-[var(--border-primary)] flex items-center gap-4 text-[10px] text-[var(--text-tertiary)]">
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)]">&uarr;&darr;</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)]">Enter</kbd> Open</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
