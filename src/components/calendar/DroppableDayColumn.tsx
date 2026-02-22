"use client";

import { useDroppable } from "@dnd-kit/core";

interface DroppableDayColumnProps {
  dayIndex: number;
  dayDate: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function DroppableDayColumn({
  dayIndex,
  dayDate,
  children,
  className,
  style,
  onClick,
}: DroppableDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-column-${dayIndex}`,
    data: { dayIndex, dayDate },
  });

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        ...style,
        backgroundColor: isOver ? "rgba(236, 72, 153, 0.05)" : undefined,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
