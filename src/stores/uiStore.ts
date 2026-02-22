import { create } from "zustand";
import type { CreateEventInput, EventOccurrence } from "@/types/event";

interface UIState {
  sidebarOpen: boolean;
  eventModalOpen: boolean;
  eventModalMode: "create" | "edit";
  selectedEventId: string | null;
  editingEventPrefill: Partial<CreateEventInput> | null;
  selectedOccurrenceDate: string | null;
  selectedIsRecurring: boolean;
  selectedMasterEventId: string | null;
  // Popover
  popoverEvent: EventOccurrence | null;
  popoverPosition: { x: number; y: number } | null;
  // Task modal
  taskModalOpen: boolean;
  taskModalMode: "create" | "edit";
  selectedTaskId: string | null;
  // Task panel (right-side on calendar)
  taskPanelOpen: boolean;
  // Search modal
  searchModalOpen: boolean;
  // Quick capture modal
  quickCaptureOpen: boolean;
  // Notification panel
  notificationPanelOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openCreateEventModal: (prefill?: Partial<CreateEventInput>) => void;
  openEditEventModal: (eventId: string, opts?: {
    occurrenceDate?: string;
    isRecurring?: boolean;
    masterEventId?: string | null;
  }) => void;
  closeEventModal: () => void;
  selectEvent: (id: string | null) => void;
  openPopover: (event: EventOccurrence, position: { x: number; y: number }) => void;
  closePopover: () => void;
  toggleTaskPanel: () => void;
  setTaskPanelOpen: (open: boolean) => void;
  openCreateTaskModal: () => void;
  openEditTaskModal: (id: string) => void;
  closeTaskModal: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
  toggleNotificationPanel: () => void;
  openNotificationPanel: () => void;
  closeNotificationPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  eventModalOpen: false,
  eventModalMode: "create",
  selectedEventId: null,
  editingEventPrefill: null,
  selectedOccurrenceDate: null,
  selectedIsRecurring: false,
  selectedMasterEventId: null,
  popoverEvent: null,
  popoverPosition: null,
  taskModalOpen: false,
  taskModalMode: "create",
  selectedTaskId: null,
  taskPanelOpen: false,
  searchModalOpen: false,
  quickCaptureOpen: false,
  notificationPanelOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openCreateEventModal: (prefill) =>
    set({
      eventModalOpen: true,
      eventModalMode: "create",
      editingEventPrefill: prefill || null,
      selectedEventId: null,
      selectedOccurrenceDate: null,
      selectedIsRecurring: false,
      selectedMasterEventId: null,
      popoverEvent: null,
      popoverPosition: null,
    }),
  openEditEventModal: (eventId, opts) =>
    set({
      eventModalOpen: true,
      eventModalMode: "edit",
      selectedEventId: eventId,
      selectedOccurrenceDate: opts?.occurrenceDate ?? null,
      selectedIsRecurring: opts?.isRecurring ?? false,
      selectedMasterEventId: opts?.masterEventId ?? null,
      popoverEvent: null,
      popoverPosition: null,
    }),
  closeEventModal: () =>
    set({
      eventModalOpen: false,
      editingEventPrefill: null,
      selectedEventId: null,
      selectedOccurrenceDate: null,
      selectedIsRecurring: false,
      selectedMasterEventId: null,
    }),
  selectEvent: (id) => set({ selectedEventId: id }),
  openPopover: (event, position) =>
    set({ popoverEvent: event, popoverPosition: position }),
  closePopover: () =>
    set({ popoverEvent: null, popoverPosition: null }),
  toggleTaskPanel: () => set((s) => ({ taskPanelOpen: !s.taskPanelOpen })),
  setTaskPanelOpen: (open) => set({ taskPanelOpen: open }),
  openCreateTaskModal: () =>
    set({ taskModalOpen: true, taskModalMode: "create", selectedTaskId: null }),
  openEditTaskModal: (id) =>
    set({ taskModalOpen: true, taskModalMode: "edit", selectedTaskId: id }),
  closeTaskModal: () =>
    set({ taskModalOpen: false, selectedTaskId: null }),
  openSearchModal: () => set({ searchModalOpen: true }),
  closeSearchModal: () => set({ searchModalOpen: false }),
  openQuickCapture: () => set({ quickCaptureOpen: true }),
  closeQuickCapture: () => set({ quickCaptureOpen: false }),
  toggleNotificationPanel: () => set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
  openNotificationPanel: () => set({ notificationPanelOpen: true }),
  closeNotificationPanel: () => set({ notificationPanelOpen: false }),
}));
