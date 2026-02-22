import { create } from "zustand";

interface DragState {
  isDragging: boolean;
  draggedEventId: string | null;
  originalStart: Date | null;
  originalEnd: Date | null;
  setDragging: (eventId: string, start: Date, end: Date) => void;
  clearDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  isDragging: false,
  draggedEventId: null,
  originalStart: null,
  originalEnd: null,
  setDragging: (eventId, start, end) =>
    set({
      isDragging: true,
      draggedEventId: eventId,
      originalStart: start,
      originalEnd: end,
    }),
  clearDrag: () =>
    set({
      isDragging: false,
      draggedEventId: null,
      originalStart: null,
      originalEnd: null,
    }),
}));
