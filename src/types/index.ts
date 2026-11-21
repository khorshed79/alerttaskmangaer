import { z } from 'zod';

export type Language = 'en' | 'bn';
export type ThemeMode = 'light' | 'dark';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Task {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  categoryId: string;
  projectId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  startAt: Date | null;
  dueAt: Date | null;
  reminderAt: Date | null;
  estimatedMinutes: number;
  actualMinutes: number;
  timerStartedAt: number | null;
  subtasks: Subtask[];
  tags: string[];
  attachments: TaskAttachment[];
  repeatRule: RepeatRule;
  recurrenceSeriesId: string | null;
  isArchived: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  ownerId: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  language: Language;
  theme: ThemeMode;
  onboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  ownerId: string;
  dueReminders: boolean;
  upcomingAlerts: boolean;
  overdueAlerts: boolean;
  dailySummary: boolean;
  morningBrief: boolean;
  morningTime: string;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  updatedAt: Date;
}

export interface AppNotification {
  id: string;
  ownerId: string;
  taskId: string;
  title: string;
  body: string;
  type: 'due' | 'upcoming' | 'overdue' | 'summary' | 'system';
  isRead: boolean;
  createdAt: Date;
}

export type AppRoute =
  | 'home'
  | 'tasks'
  | 'calendar'
  | 'insights'
  | 'categories'
  | 'notifications'
  | 'profile';

export const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, 'titleRequired').max(140, 'titleTooLong'),
    description: z.string().max(2000).default(''),
    categoryId: z.string().min(1, 'categoryRequired').max(64),
    projectId: z.string().max(64).nullable().default(null),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
    startAt: z.string().nullable().default(null),
    dueAt: z.string().nullable().default(null),
    reminderAt: z.string().nullable().default(null),
    estimatedMinutes: z.number().min(0).max(14400).default(30),
    repeatRule: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
    tags: z.array(z.string().trim().min(1).max(32)).max(10).default([]),
    subtasks: z
      .array(
        z.object({
          id: z.string(),
          title: z.string().trim().min(1).max(120),
          completed: z.boolean(),
        })
      )
      .max(25)
      .default([]),
  })
  .refine(
    (data) => {
      if (data.startAt && data.dueAt) {
        return new Date(data.dueAt).getTime() >= new Date(data.startAt).getTime();
      }
      return true;
    },
    { message: 'invalidDueDate', path: ['dueAt'] }
  );

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1).max(48),
  color: z.string().min(4).max(16),
  icon: z.string().min(1).max(32),
});

export const projectFormSchema = z.object({
  name: z.string().trim().min(1).max(64),
  description: z.string().max(300).default(''),
  color: z.string().min(4).max(16),
  icon: z.string().min(1).max(32),
});

export const profileFormSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  bio: z.string().max(240).default(''),
});
