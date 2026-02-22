"use client";

import { CALENDAR_COLORS } from "@/lib/colors";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CALENDAR_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: color.value,
            borderColor: value === color.value ? "var(--text-primary)" : "transparent",
          }}
          title={color.name}
        />
      ))}
    </div>
  );
}
