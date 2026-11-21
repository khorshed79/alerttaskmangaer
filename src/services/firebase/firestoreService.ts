import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import {
  AppNotification,
  Category,
  Language,
  NotificationPreferences,
  Project,
  RepeatRule,
  Subtask,
  Task,
  TaskAttachment,
  TaskPriority,
  TaskStatus,
  ThemeMode,
  UserProfile,
} from '../../types';
import { computeNextDueDate } from '../../utils/analytics';
import { toLocalDateKey } from '../../utils/formatters';

export const DEFAULT_CATEGORIES: { id: string; name: string; color: string; icon: string }[] = [
  { id: 'work', name: 'Work', color: '#6548F5', icon: 'Briefcase' },
  { id: 'personal', name: 'Personal', color: '#8067FF', icon: 'User' },
  { id: 'health', name: 'Health', color: '#36B98A', icon: 'HeartPulse' },
  { id: 'study', name: 'Study', color: '#3B82F6', icon: 'BookOpen' },
  { id: 'shopping', name: 'Shopping', color: '#F3AD55', icon: 'ShoppingBag' },
  { id: 'finance', name: 'Finance', color: '#10B981', icon: 'Wallet' },
  { id: 'other', name: 'Other', color: '#88889A', icon: 'Layers' },
];

export function makeSafeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${Date.now()}_${rand}`.slice(0, 120);
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

function toDateOrNow(value: unknown): Date {
  return toDateOrNull(value) ?? new Date();
}

export async function bootstrapUserWorkspace(
  user: User,
  defaults?: { language?: Language; theme?: ThemeMode }
): Promise<void> {
  const uid = user.uid;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const displayName = (user.displayName || user.email?.split('@')[0] || 'User').slice(0, 80);
      await setDoc(userRef, {
        uid,
        displayName,
        email: (user.email || 'user@taskflow.app').slice(0, 160),
        photoURL: (user.photoURL || '').slice(0, 200000),
        bio: '',
        language: defaults?.language ?? 'en',
        theme: defaults?.theme ?? 'light',
        onboarded: Boolean(user.displayName),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const batch = writeBatch(db);
      for (const cat of DEFAULT_CATEGORIES) {
        const catRef = doc(db, 'users', uid, 'categories', cat.id);
        batch.set(catRef, {
          id: cat.id,
          ownerId: uid,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          isDefault: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const prefRef = doc(db, 'users', uid, 'notificationPreferences', 'settings');
      batch.set(prefRef, {
        ownerId: uid,
        dueReminders: true,
        upcomingAlerts: true,
        overdueAlerts: true,
        dailySummary: true,
        morningBrief: false,
        morningTime: '08:30',
        quietHoursEnabled: false,
        quietStart: '22:00',
        quietEnd: '07:00',
        updatedAt: serverTimestamp(),
      });

      const starterProjectId = 'proj_daily_focus';
      batch.set(doc(db, 'users', uid, 'projects', starterProjectId), {
        id: starterProjectId,
        ownerId: uid,
        name: 'Daily Focus',
        description: 'Core priorities and high-leverage daily execution.',
        color: '#6548F5',
        icon: 'FolderKanban',
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } else {
      // Ensure notification preferences and categories exist if missing
      const prefRef = doc(db, 'users', uid, 'notificationPreferences', 'settings');
      const prefSnap = await getDoc(prefRef);
      if (!prefSnap.exists()) {
        await setDoc(prefRef, {
          ownerId: uid,
          dueReminders: true,
          upcomingAlerts: true,
          overdueAlerts: true,
          dailySummary: true,
          morningBrief: false,
          morningTime: '08:30',
          quietHoursEnabled: false,
          quietStart: '22:00',
          quietEnd: '07:00',
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      onData({
        uid: d.uid,
        displayName: d.displayName ?? 'User',
        email: d.email ?? '',
        photoURL: d.photoURL ?? '',
        bio: d.bio ?? '',
        language: d.language === 'bn' ? 'bn' : 'en',
        theme: d.theme === 'dark' ? 'dark' : 'light',
        onboarded: Boolean(d.onboarded),
        createdAt: toDateOrNow(d.createdAt),
        updatedAt: toDateOrNow(d.updatedAt),
      });
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

export function subscribeTasks(
  uid: string,
  pageLimit: number,
  onData: (tasks: Task[]) => void
): Unsubscribe {
  const path = `users/${uid}/tasks`;
  const q = query(
    collection(db, 'users', uid, 'tasks'),
    where('ownerId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(pageLimit)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: Task[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: d.ownerId,
          title: d.title,
          description: d.description ?? '',
          categoryId: d.categoryId ?? 'other',
          projectId: d.projectId ?? null,
          priority: (d.priority as TaskPriority) ?? 'medium',
          status: (d.status as TaskStatus) ?? 'pending',
          startAt: toDateOrNull(d.startAt),
          dueAt: toDateOrNull(d.dueAt),
          reminderAt: toDateOrNull(d.reminderAt),
          estimatedMinutes: Number(d.estimatedMinutes ?? 30),
          actualMinutes: Number(d.actualMinutes ?? 0),
          timerStartedAt: typeof d.timerStartedAt === 'number' ? d.timerStartedAt : null,
          subtasks: Array.isArray(d.subtasks) ? d.subtasks : [],
          tags: Array.isArray(d.tags) ? d.tags : [],
          attachments: Array.isArray(d.attachments) ? d.attachments : [],
          repeatRule: (d.repeatRule as RepeatRule) ?? 'none',
          recurrenceSeriesId: d.recurrenceSeriesId ?? null,
          isArchived: Boolean(d.isArchived),
          completedAt: toDateOrNull(d.completedAt),
          createdAt: toDateOrNow(d.createdAt),
          updatedAt: toDateOrNow(d.updatedAt),
        };
      });
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeCategories(
  uid: string,
  onData: (categories: Category[]) => void
): Unsubscribe {
  const path = `users/${uid}/categories`;
  const q = query(collection(db, 'users', uid, 'categories'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: Category[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: d.ownerId,
          name: d.name,
          color: d.color,
          icon: d.icon,
          isDefault: Boolean(d.isDefault),
          createdAt: toDateOrNow(d.createdAt),
          updatedAt: toDateOrNow(d.updatedAt),
        };
      });
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeProjects(
  uid: string,
  onData: (projects: Project[]) => void
): Unsubscribe {
  const path = `users/${uid}/projects`;
  const q = query(collection(db, 'users', uid, 'projects'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: Project[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: d.ownerId,
          name: d.name,
          description: d.description ?? '',
          color: d.color,
          icon: d.icon,
          isArchived: Boolean(d.isArchived),
          createdAt: toDateOrNow(d.createdAt),
          updatedAt: toDateOrNow(d.updatedAt),
        };
      });
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeNotificationPreferences(
  uid: string,
  onData: (prefs: NotificationPreferences | null) => void
): Unsubscribe {
  const path = `users/${uid}/notificationPreferences/settings`;
  return onSnapshot(
    doc(db, 'users', uid, 'notificationPreferences', 'settings'),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      onData({
        ownerId: d.ownerId,
        dueReminders: Boolean(d.dueReminders),
        upcomingAlerts: Boolean(d.upcomingAlerts),
        overdueAlerts: Boolean(d.overdueAlerts),
        dailySummary: Boolean(d.dailySummary),
        morningBrief: Boolean(d.morningBrief),
        morningTime: d.morningTime ?? '08:30',
        quietHoursEnabled: Boolean(d.quietHoursEnabled),
        quietStart: d.quietStart ?? '22:00',
        quietEnd: d.quietEnd ?? '07:00',
        updatedAt: toDateOrNow(d.updatedAt),
      });
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

export function subscribeNotifications(
  uid: string,
  onData: (items: AppNotification[]) => void
): Unsubscribe {
  const path = `users/${uid}/notifications`;
  const q = query(
    collection(db, 'users', uid, 'notifications'),
    where('ownerId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(40)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: AppNotification[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: d.ownerId,
          taskId: d.taskId ?? '',
          title: d.title,
          body: d.body ?? '',
          type: d.type ?? 'system',
          isRead: Boolean(d.isRead),
          createdAt: toDateOrNow(d.createdAt),
        };
      });
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

// --- User Profile Mutations ---
export async function updateUserProfileFields(
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'language' | 'theme' | 'onboarded'>>
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.displayName !== undefined) clean.displayName = updates.displayName.trim().slice(0, 80);
    if (updates.photoURL !== undefined) clean.photoURL = updates.photoURL.slice(0, 200000);
    if (updates.bio !== undefined) clean.bio = updates.bio.slice(0, 240);
    if (updates.language !== undefined) clean.language = updates.language;
    if (updates.theme !== undefined) clean.theme = updates.theme;
    if (updates.onboarded !== undefined) clean.onboarded = updates.onboarded;
    await updateDoc(doc(db, 'users', uid), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- Task Mutations ---
export interface TaskInputPayload {
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
  actualMinutes?: number;
  subtasks: Subtask[];
  tags: string[];
  attachments: TaskAttachment[];
  repeatRule: RepeatRule;
}

export async function createTask(uid: string, input: TaskInputPayload): Promise<string> {
  const taskId = makeSafeId('task');
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    const sanitizedTags = input.tags.map((tag) => tag.trim().slice(0, 32)).filter(Boolean).slice(0, 10);
    const sanitizedSubtasks = input.subtasks
      .map((s) => ({ id: s.id, title: s.title.trim().slice(0, 120), completed: Boolean(s.completed) }))
      .filter((s) => s.title.length > 0)
      .slice(0, 25);
    const sanitizedAttachments = input.attachments.slice(0, 10);

    await setDoc(doc(db, 'users', uid, 'tasks', taskId), {
      id: taskId,
      ownerId: uid,
      title: input.title.trim().slice(0, 140),
      description: input.description.slice(0, 2000),
      categoryId: input.categoryId.slice(0, 64),
      projectId: input.projectId ? input.projectId.slice(0, 64) : null,
      priority: input.priority,
      status: input.status,
      startAt: input.startAt ? Timestamp.fromDate(input.startAt) : null,
      dueAt: input.dueAt ? Timestamp.fromDate(input.dueAt) : null,
      reminderAt: input.reminderAt ? Timestamp.fromDate(input.reminderAt) : null,
      estimatedMinutes: Math.max(0, Math.min(14400, Math.round(input.estimatedMinutes || 0))),
      actualMinutes: Math.max(0, Math.min(14400, Math.round(input.actualMinutes || 0))),
      timerStartedAt: null,
      subtasks: sanitizedSubtasks,
      tags: sanitizedTags,
      attachments: sanitizedAttachments,
      repeatRule: input.repeatRule,
      recurrenceSeriesId: input.repeatRule !== 'none' ? taskId : null,
      isArchived: false,
      completedAt: input.status === 'completed' ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return taskId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTask(
  uid: string,
  taskId: string,
  input: TaskInputPayload
): Promise<void> {
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    const sanitizedTags = input.tags.map((tag) => tag.trim().slice(0, 32)).filter(Boolean).slice(0, 10);
    const sanitizedSubtasks = input.subtasks
      .map((s) => ({ id: s.id, title: s.title.trim().slice(0, 120), completed: Boolean(s.completed) }))
      .filter((s) => s.title.length > 0)
      .slice(0, 25);
    const sanitizedAttachments = input.attachments.slice(0, 10);

    await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
      title: input.title.trim().slice(0, 140),
      description: input.description.slice(0, 2000),
      categoryId: input.categoryId.slice(0, 64),
      projectId: input.projectId ? input.projectId.slice(0, 64) : null,
      priority: input.priority,
      status: input.status,
      startAt: input.startAt ? Timestamp.fromDate(input.startAt) : null,
      dueAt: input.dueAt ? Timestamp.fromDate(input.dueAt) : null,
      reminderAt: input.reminderAt ? Timestamp.fromDate(input.reminderAt) : null,
      estimatedMinutes: Math.max(0, Math.min(14400, Math.round(input.estimatedMinutes || 0))),
      actualMinutes: Math.max(0, Math.min(14400, Math.round(input.actualMinutes || 0))),
      subtasks: sanitizedSubtasks,
      tags: sanitizedTags,
      attachments: sanitizedAttachments,
      repeatRule: input.repeatRule,
      completedAt: input.status === 'completed' ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleTaskCompletion(uid: string, task: Task): Promise<void> {
  const path = `users/${uid}/tasks/${task.id}`;
  const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
  try {
    await updateDoc(doc(db, 'users', uid, 'tasks', task.id), {
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });

    // Idempotent client-side next recurrence generation when completing a recurring task
    if (nextStatus === 'completed' && task.repeatRule !== 'none') {
      const baseDate = task.dueAt ?? new Date();
      const nextDue = computeNextDueDate(baseDate, task.repeatRule);
      const seriesId = (task.recurrenceSeriesId || task.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      const nextId = `${seriesId}_${toLocalDateKey(nextDue)}`.slice(0, 128);
      const nextRef = doc(db, 'users', uid, 'tasks', nextId);
      const existingNext = await getDoc(nextRef);
      if (!existingNext.exists()) {
        await setDoc(nextRef, {
          id: nextId,
          ownerId: uid,
          title: task.title.slice(0, 140),
          description: task.description.slice(0, 2000),
          categoryId: task.categoryId,
          projectId: task.projectId,
          priority: task.priority,
          status: 'pending',
          startAt: null,
          dueAt: Timestamp.fromDate(nextDue),
          reminderAt: null,
          estimatedMinutes: task.estimatedMinutes,
          actualMinutes: 0,
          timerStartedAt: null,
          subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
          tags: task.tags,
          attachments: [],
          repeatRule: task.repeatRule,
          recurrenceSeriesId: seriesId,
          isArchived: false,
          completedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateTaskSubtasks(
  uid: string,
  taskId: string,
  subtasks: Subtask[]
): Promise<void> {
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
      subtasks: subtasks.slice(0, 25),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleTaskTimer(uid: string, task: Task): Promise<void> {
  const path = `users/${uid}/tasks/${task.id}`;
  try {
    if (task.timerStartedAt) {
      const elapsedMinutes = Math.max(
        1,
        Math.round((Date.now() - task.timerStartedAt) / 60000)
      );
      await updateDoc(doc(db, 'users', uid, 'tasks', task.id), {
        timerStartedAt: null,
        actualMinutes: Math.min(14400, task.actualMinutes + elapsedMinutes),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'users', uid, 'tasks', task.id), {
        timerStartedAt: Date.now(),
        status: task.status === 'pending' ? 'in_progress' : task.status,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleTaskArchive(uid: string, task: Task): Promise<void> {
  const path = `users/${uid}/tasks/${task.id}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'tasks', task.id), {
      isArchived: !task.isArchived,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function duplicateTask(uid: string, task: Task): Promise<string> {
  return createTask(uid, {
    title: `${task.title.slice(0, 125)} (Copy)`,
    description: task.description,
    categoryId: task.categoryId,
    projectId: task.projectId,
    priority: task.priority,
    status: 'pending',
    startAt: task.startAt,
    dueAt: task.dueAt,
    reminderAt: null,
    estimatedMinutes: task.estimatedMinutes,
    actualMinutes: 0,
    subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
    tags: task.tags,
    attachments: [],
    repeatRule: 'none',
  });
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Category Mutations ---
export async function createCategory(
  uid: string,
  input: { name: string; color: string; icon: string }
): Promise<string> {
  const categoryId = makeSafeId('cat');
  const path = `users/${uid}/categories/${categoryId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'categories', categoryId), {
      id: categoryId,
      ownerId: uid,
      name: input.name.trim().slice(0, 48),
      color: input.color.slice(0, 16),
      icon: input.icon.slice(0, 32),
      isDefault: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return categoryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCategory(
  uid: string,
  categoryId: string,
  input: { name: string; color: string; icon: string }
): Promise<void> {
  const path = `users/${uid}/categories/${categoryId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'categories', categoryId), {
      name: input.name.trim().slice(0, 48),
      color: input.color.slice(0, 16),
      icon: input.icon.slice(0, 32),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCategory(uid: string, categoryId: string): Promise<void> {
  const path = `users/${uid}/categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Project Mutations ---
export async function createProject(
  uid: string,
  input: { name: string; description: string; color: string; icon: string }
): Promise<string> {
  const projectId = makeSafeId('proj');
  const path = `users/${uid}/projects/${projectId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'projects', projectId), {
      id: projectId,
      ownerId: uid,
      name: input.name.trim().slice(0, 64),
      description: input.description.trim().slice(0, 300),
      color: input.color.slice(0, 16),
      icon: input.icon.slice(0, 32),
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return projectId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProject(
  uid: string,
  projectId: string,
  input: { name: string; description: string; color: string; icon: string; isArchived?: boolean }
): Promise<void> {
  const path = `users/${uid}/projects/${projectId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'projects', projectId), {
      name: input.name.trim().slice(0, 64),
      description: input.description.trim().slice(0, 300),
      color: input.color.slice(0, 16),
      icon: input.icon.slice(0, 32),
      isArchived: Boolean(input.isArchived),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProject(uid: string, projectId: string): Promise<void> {
  const path = `users/${uid}/projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Notification Preferences & Notifications ---
export async function updateNotificationPreferences(
  uid: string,
  prefs: Omit<NotificationPreferences, 'ownerId' | 'updatedAt'>
): Promise<void> {
  const path = `users/${uid}/notificationPreferences/settings`;
  try {
    await updateDoc(doc(db, 'users', uid, 'notificationPreferences', 'settings'), {
      ...prefs,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createNotificationIfNotExists(
  uid: string,
  notificationId: string,
  payload: {
    taskId: string;
    title: string;
    body: string;
    type: AppNotification['type'];
  }
): Promise<void> {
  const safeId = notificationId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${uid}/notifications/${safeId}`;
  try {
    const ref = doc(db, 'users', uid, 'notifications', safeId);
    const existing = await getDoc(ref);
    if (existing.exists()) return;
    await setDoc(ref, {
      id: safeId,
      ownerId: uid,
      taskId: payload.taskId.slice(0, 128),
      title: payload.title.slice(0, 140),
      body: payload.body.slice(0, 400),
      type: payload.type,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  const path = `users/${uid}/notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), {
      isRead: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsRead(uid: string, items: AppNotification[]): Promise<void> {
  const unread = items.filter((n) => !n.isRead);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'users', uid, 'notifications', n.id), { isRead: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/notifications`);
  }
}

export async function clearAllNotifications(uid: string, items: AppNotification[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const batch = writeBatch(db);
    items.forEach((n) => {
      batch.delete(doc(db, 'users', uid, 'notifications', n.id));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/notifications`);
  }
}

export async function deleteAllUserFirestoreData(uid: string): Promise<void> {
  const subcollections = ['tasks', 'categories', 'projects', 'notifications', 'notificationPreferences'];
  try {
    for (const sub of subcollections) {
      const q =
        sub === 'notificationPreferences'
          ? query(collection(db, 'users', uid, sub))
          : query(collection(db, 'users', uid, sub), where('ownerId', '==', uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
  }
}
