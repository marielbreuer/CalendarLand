"use client";

import { useState } from "react";

interface ParticipantInputProps {
  value: { name: string; email: string }[];
  onChange: (participants: { name: string; email: string }[]) => void;
}

export function ParticipantInput({ value, onChange }: ParticipantInputProps) {
  const [input, setInput] = useState("");

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addParticipant();
    }
    if (e.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function addParticipant() {
    const email = input.trim().replace(/,$/, "");
    if (!email || !email.includes("@")) return;
    if (value.some((p) => p.email === email)) return;

    onChange([...value, { name: email.split("@")[0], email }]);
    setInput("");
  }

  function removeParticipant(email: string) {
    onChange(value.filter((p) => p.email !== email));
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] min-h-[40px]">
      {value.map((p) => (
        <span
          key={p.email}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--accent-light)] text-[var(--accent-hover)] rounded-full text-xs"
        >
          {p.email}
          <button
            type="button"
            onClick={() => removeParticipant(p.email)}
            className="hover:text-[var(--accent)]"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        type="email"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addParticipant}
        placeholder={value.length === 0 ? "Add email and press Enter..." : ""}
        className="flex-1 min-w-[150px] bg-transparent text-sm focus:outline-none"
      />
    </div>
  );
}
