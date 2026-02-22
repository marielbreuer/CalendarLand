export interface EventTemplate {
  id: string;
  name: string;
  title: string;
  description: string | null;
  location: string | null;
  meetingLink: string | null;
  duration: number; // minutes
  calendarId: string | null;
  participants: { name: string; email: string }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  title: string;
  description?: string;
  location?: string;
  meetingLink?: string;
  duration: number;
  calendarId?: string;
  participants?: { name: string; email: string }[];
  tags?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  meetingLink?: string | null;
  duration?: number;
  calendarId?: string | null;
  participants?: { name: string; email: string }[];
  tags?: string[];
}
