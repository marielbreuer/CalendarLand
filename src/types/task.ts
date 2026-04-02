export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskDifficulty = "easy" | "medium" | "hard";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  difficulty: TaskDifficulty | null;
  sortOrder: number;
  tags: string[];
  calendarId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  difficulty?: TaskDifficulty;
  sortOrder?: number;
  tags?: string[];
  calendarId: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  difficulty?: TaskDifficulty | null;
  sortOrder?: number;
  tags?: string[];
  calendarId?: string;
}

export interface ReorderTaskInput {
  id: string;
  sortOrder: number;
  status?: TaskStatus;
}
