export interface Calendar {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  isDefault: boolean;
  sortOrder: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  isAlwaysAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarInput {
  name: string;
  color: string;
}

export interface UpdateCalendarInput {
  name?: string;
  color?: string;
  isVisible?: boolean;
  sortOrder?: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: number[];
  isAlwaysAvailable?: boolean;
}
