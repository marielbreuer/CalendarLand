"use client";

import { useState, useRef, useEffect } from "react";
import { useTags, useCreateTag } from "@/hooks/useTags";

interface TagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagPicker({ value, onChange }: TagPickerProps) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useTags(input || undefined);
  const createTag = useCreateTag();
  const suggestions = (data?.tags ?? []).filter(
    (t) => !value.includes(t.name)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(name: string) {
    if (!value.includes(name)) {
      onChange([...value, name]);
    }
    setInput("");
    setShowDropdown(false);
  }

  function removeTag(name: string) {
    onChange(value.filter((t) => t !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed) {
        addTag(trimmed);
        // Create tag in registry if it doesn't exist
        const exists = data?.tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
        if (!exists) {
          createTag.mutate({ name: trimmed });
        }
      }
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]";

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
        Tags
      </label>

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((tag) => {
            const tagData = data?.tags.find((t) => t.name === tag);
            return (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-[var(--text-secondary)]"
                style={{
                  backgroundColor: tagData?.color
                    ? `${tagData.color}20`
                    : "var(--bg-tertiary)",
                  borderLeft: tagData?.color
                    ? `3px solid ${tagData.color}`
                    : undefined,
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-[var(--text-primary)] transition-colors ml-0.5"
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder="Type to search or create tags..."
        className={inputClass}
      />

      {/* Dropdown */}
      {showDropdown && (input.length > 0 || suggestions.length > 0) && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-40 overflow-auto">
          {suggestions.slice(0, 8).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag.name)}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--bg-tertiary)] flex items-center gap-2 transition-colors"
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span>{tag.name}</span>
              <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">
                {tag.usageCount}
              </span>
            </button>
          ))}
          {input.trim() &&
            !suggestions.some(
              (t) => t.name.toLowerCase() === input.trim().toLowerCase()
            ) &&
            !value.includes(input.trim()) && (
              <button
                type="button"
                onClick={() => {
                  const trimmed = input.trim();
                  addTag(trimmed);
                  createTag.mutate({ name: trimmed });
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--bg-tertiary)] text-[var(--accent)] transition-colors"
              >
                Create &ldquo;{input.trim()}&rdquo;
              </button>
            )}
          {suggestions.length === 0 && !input.trim() && (
            <div className="px-3 py-2 text-xs text-[var(--text-tertiary)]">
              No tags yet. Type to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
