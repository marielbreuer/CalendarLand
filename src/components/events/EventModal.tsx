"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { EventForm } from "./EventForm";
import { RecurrenceScopeDialog } from "./RecurrenceScopeDialog";
import { useUIStore } from "@/stores/uiStore";
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useCalendars } from "@/hooks/useCalendars";
import { apiGet } from "@/lib/api-client";
import { toast } from "sonner";
import type { Event, CreateEventInput, RecurrenceScope, EventOccurrence } from "@/types/event";

interface EventModalProps {
  allEvents?: EventOccurrence[];
}

export function EventModal({ allEvents = [] }: EventModalProps) {
  const {
    eventModalOpen,
    eventModalMode,
    selectedEventId,
    editingEventPrefill,
    selectedOccurrenceDate,
    selectedIsRecurring,
    selectedMasterEventId,
    closeEventModal,
  } = useUIStore();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { data: calendars } = useCalendars();
  const [existingEvent, setExistingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);

  // Scope dialog state
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [scopeAction, setScopeAction] = useState<"edit" | "delete">("edit");
  const [pendingEditData, setPendingEditData] = useState<CreateEventInput | null>(null);

  useEffect(() => {
    if (eventModalMode === "edit" && selectedEventId) {
      setLoading(true);
      apiGet<Event>(`/events/${selectedEventId}`)
        .then(setExistingEvent)
        .catch(() => toast.error("Failed to load event"))
        .finally(() => setLoading(false));
    } else {
      setExistingEvent(null);
    }
  }, [eventModalMode, selectedEventId]);

  function handleCreate(data: CreateEventInput) {
    createEvent.mutate(data, {
      onSuccess: () => {
        toast.success("Event created");
        closeEventModal();
      },
      onError: (err) => toast.error(err.message),
    });
  }

  function handleUpdate(data: CreateEventInput) {
    if (!selectedEventId) return;

    // If this is a recurring event, show scope dialog
    if (selectedIsRecurring || existingEvent?.isRecurring) {
      setPendingEditData(data);
      setScopeAction("edit");
      setScopeDialogOpen(true);
      return;
    }

    // Non-recurring: direct update
    updateEvent.mutate(
      { id: selectedEventId, data },
      {
        onSuccess: () => {
          toast.success("Event updated");
          closeEventModal();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleDelete() {
    if (!selectedEventId) return;

    // If recurring, show scope dialog
    if (selectedIsRecurring || existingEvent?.isRecurring) {
      setScopeAction("delete");
      setScopeDialogOpen(true);
      return;
    }

    // Non-recurring: direct delete
    deleteEvent.mutate(
      { id: selectedEventId },
      {
        onSuccess: () => {
          toast.success("Event deleted");
          closeEventModal();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleScopeSelect(scope: RecurrenceScope) {
    if (!selectedEventId) return;
    const eventId = selectedMasterEventId || selectedEventId;

    if (scopeAction === "edit" && pendingEditData) {
      updateEvent.mutate(
        {
          id: eventId,
          data: pendingEditData,
          scope,
          occurrenceDate: selectedOccurrenceDate ?? undefined,
        },
        {
          onSuccess: () => {
            toast.success("Event updated");
            setScopeDialogOpen(false);
            closeEventModal();
          },
          onError: (err) => toast.error(err.message),
        }
      );
    } else if (scopeAction === "delete") {
      deleteEvent.mutate(
        {
          id: eventId,
          scope,
          occurrenceDate: selectedOccurrenceDate ?? undefined,
        },
        {
          onSuccess: () => {
            toast.success("Event deleted");
            setScopeDialogOpen(false);
            closeEventModal();
          },
          onError: (err) => toast.error(err.message),
        }
      );
    }
  }

  return (
    <>
      <Modal
        open={eventModalOpen}
        onClose={closeEventModal}
        title={eventModalMode === "create" ? "New Event" : "Edit Event"}
        maxWidth="max-w-xl"
        closeOnOverlayClick={false}
        closeOnEscape={false}
      >
        {loading ? (
          <div className="py-8 text-center text-[var(--text-secondary)]">
            Loading...
          </div>
        ) : (
          <EventForm
            mode={eventModalMode}
            calendars={calendars ?? []}
            prefill={editingEventPrefill ?? undefined}
            existingEvent={existingEvent ?? undefined}
            allEvents={allEvents}
            onSubmit={eventModalMode === "create" ? handleCreate : handleUpdate}
            onDelete={eventModalMode === "edit" ? handleDelete : undefined}
            onCancel={closeEventModal}
            isSubmitting={createEvent.isPending || updateEvent.isPending}
          />
        )}
      </Modal>

      <RecurrenceScopeDialog
        open={scopeDialogOpen}
        action={scopeAction}
        onSelect={handleScopeSelect}
        onCancel={() => {
          setScopeDialogOpen(false);
          setPendingEditData(null);
        }}
      />
    </>
  );
}
