"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TaskForm } from "./TaskForm";
import { useUIStore } from "@/stores/uiStore";
import { useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useCalendars } from "@/hooks/useCalendars";
import { apiGet } from "@/lib/api-client";
import { toast } from "sonner";
import type { Task, CreateTaskInput } from "@/types/task";

export function TaskModal() {
  const {
    taskModalOpen,
    taskModalMode,
    selectedTaskId,
    closeTaskModal,
  } = useUIStore();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: calendars } = useCalendars();
  const [existingTask, setExistingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskModalMode === "edit" && selectedTaskId) {
      setLoading(true);
      apiGet<Task>(`/tasks/${selectedTaskId}`)
        .then(setExistingTask)
        .catch(() => toast.error("Failed to load task"))
        .finally(() => setLoading(false));
    } else {
      setExistingTask(null);
    }
  }, [taskModalMode, selectedTaskId]);

  function handleCreate(data: CreateTaskInput) {
    createTask.mutate(data, {
      onSuccess: () => {
        toast.success("Task created");
        closeTaskModal();
      },
      onError: (err) => toast.error(err.message),
    });
  }

  function handleUpdate(data: CreateTaskInput) {
    if (!selectedTaskId) return;
    updateTask.mutate(
      { id: selectedTaskId, data },
      {
        onSuccess: () => {
          toast.success("Task updated");
          closeTaskModal();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleDelete() {
    if (!selectedTaskId) return;
    deleteTask.mutate(selectedTaskId, {
      onSuccess: () => {
        toast.success("Task deleted");
        closeTaskModal();
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <Modal
      open={taskModalOpen}
      onClose={closeTaskModal}
      title={taskModalMode === "create" ? "New Task" : "Edit Task"}
      maxWidth="max-w-xl"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      {loading ? (
        <div className="py-8 text-center text-[var(--text-secondary)]">
          Loading...
        </div>
      ) : (
        <TaskForm
          mode={taskModalMode}
          calendars={calendars ?? []}
          existingTask={existingTask ?? undefined}
          onSubmit={taskModalMode === "create" ? handleCreate : handleUpdate}
          onDelete={taskModalMode === "edit" ? handleDelete : undefined}
          onCancel={closeTaskModal}
          isSubmitting={createTask.isPending || updateTask.isPending}
        />
      )}
    </Modal>
  );
}
