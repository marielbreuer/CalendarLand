export interface UserSettings {
  id: string;
  bufferMinutes: number;
  secondaryTimezone: string | null;
  autoStopTimer: boolean;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  bufferMinutes?: number;
  secondaryTimezone?: string | null;
  autoStopTimer?: boolean;
}
