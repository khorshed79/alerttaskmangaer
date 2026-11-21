import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  AppNotification,
  Category,
  Language,
  NotificationPreferences,
  Project,
  Task,
  ThemeMode,
  UserProfile,
} from '../types';
import {
  createNotificationIfNotExists,
  subscribeCategories,
  subscribeNotificationPreferences,
  subscribeNotifications,
  subscribeProjects,
  subscribeTasks,
  subscribeUserProfile,
  updateUserProfileFields,
} from '../services/firebase/firestoreService';
import { toLocalDateKey } from '../utils/formatters';

interface AppDataContextValue {
  profile: UserProfile | null;
  tasks: Task[];
  categories: Category[];
  projects: Project[];
  notificationPrefs: NotificationPreferences | null;
  notifications: AppNotification[];
  dataLoading: boolean;
  isOffline: boolean;
  language: Language;
  theme: ThemeMode;
  taskLimit: number;
  loadMoreTasks: () => void;
  setLanguage: (lang: Language) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  browserPermission: NotificationPermission | 'unsupported';
  requestBrowserNotificationPermission: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function isWithinQuietHours(prefs: NotificationPreferences, now: Date): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const [sh, sm] = prefs.quietStart.split(':').map(Number);
  const [eh, em] = prefs.quietEnd.split(':').map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return false;
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const minsStart = sh * 60 + sm;
  const minsEnd = eh * 60 + em;
  if (minsStart <= minsEnd) {
    return minsNow >= minsStart && minsNow <= minsEnd;
  }
  return minsNow >= minsStart || minsNow <= minsEnd;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [taskLimit, setTaskLimit] = useState(100);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('taskflow_lang');
    return saved === 'bn' ? 'bn' : 'en';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('taskflow_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return window.Notification.permission;
  });

  // Sync HTML .dark class whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('taskflow_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('taskflow_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  // Network online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Attach Firestore listeners only when authenticated & email verified
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setProfile(null);
      setTasks([]);
      setCategories([]);
      setProjects([]);
      setNotificationPrefs(null);
      setNotifications([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const uid = user.uid;
    let firstLoaded = 0;
    const markReady = () => {
      firstLoaded += 1;
      if (firstLoaded >= 2) setDataLoading(false);
    };

    const unsubProfile = subscribeUserProfile(uid, (p) => {
      setProfile(p);
      if (p) {
        setLanguageState(p.language);
        setThemeState(p.theme);
      }
      markReady();
    });

    const unsubTasks = subscribeTasks(uid, taskLimit, (list) => {
      setTasks(list);
      markReady();
    });

    const unsubCategories = subscribeCategories(uid, setCategories);
    const unsubProjects = subscribeProjects(uid, setProjects);
    const unsubPrefs = subscribeNotificationPreferences(uid, setNotificationPrefs);
    const unsubNotifs = subscribeNotifications(uid, setNotifications);

    return () => {
      unsubProfile();
      unsubTasks();
      unsubCategories();
      unsubProjects();
      unsubPrefs();
      unsubNotifs();
    };
  }, [user, taskLimit]);

  // Reminder & Overdue evaluation engine (deduplicated per task & day/due timestamp)
  const evaluatedKeysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user || !user.emailVerified || !notificationPrefs) return;

    const evaluateReminders = () => {
      const now = new Date();
      if (isWithinQuietHours(notificationPrefs, now)) return;

      const todayKey = toLocalDateKey(now);
      tasks.forEach((task) => {
        if (task.isArchived || task.status === 'completed' || task.status === 'cancelled') return;

        // 1. Explicit reminderAt trigger (within +/- 5 min window or missed up to 60m)
        if (notificationPrefs.dueReminders && task.reminderAt) {
          const diffMs = now.getTime() - task.reminderAt.getTime();
          if (diffMs >= 0 && diffMs <= 60 * 60 * 1000) {
            const key = `rem_${task.id}_${task.reminderAt.getTime()}`;
            if (!evaluatedKeysRef.current.has(key)) {
              evaluatedKeysRef.current.add(key);
              createNotificationIfNotExists(user.uid, key, {
                taskId: task.id,
                title: language === 'bn' ? `রিমাইন্ডার: ${task.title}` : `Reminder: ${task.title}`,
                body:
                  language === 'bn'
                    ? 'আপনার নির্ধারিত কাজের রিমাইন্ডার সময় হয়েছে।'
                    : 'Your scheduled task reminder is active.',
                type: 'due',
              }).catch(() => {});
              if (browserPermission === 'granted') {
                try {
                  new window.Notification(task.title, {
                    body: language === 'bn' ? 'কাজের রিমাইন্ডার' : 'Scheduled task reminder',
                  });
                } catch {
                  // Browser notification blocked by frame policy
                }
              }
            }
          }
        }

        // 2. Upcoming alert (within 30 min before dueAt)
        if (notificationPrefs.upcomingAlerts && task.dueAt) {
          const untilDue = task.dueAt.getTime() - now.getTime();
          if (untilDue > 0 && untilDue <= 30 * 60 * 1000) {
            const key = `up_${task.id}_${task.dueAt.getTime()}`;
            if (!evaluatedKeysRef.current.has(key)) {
              evaluatedKeysRef.current.add(key);
              createNotificationIfNotExists(user.uid, key, {
                taskId: task.id,
                title: language === 'bn' ? `আসন্ন কাজ: ${task.title}` : `Upcoming: ${task.title}`,
                body:
                  language === 'bn'
                    ? 'এই কাজটির সময় ৩০ মিনিটের মধ্যে শেষ হবে।'
                    : 'Due within the next 30 minutes.',
                type: 'upcoming',
              }).catch(() => {});
            }
          }
        }

        // 3. Overdue alert (once per day per task)
        if (notificationPrefs.overdueAlerts && task.dueAt && task.dueAt.getTime() < now.getTime()) {
          const key = `over_${task.id}_${todayKey}`;
          if (!evaluatedKeysRef.current.has(key)) {
            evaluatedKeysRef.current.add(key);
            createNotificationIfNotExists(user.uid, key, {
              taskId: task.id,
              title: language === 'bn' ? `মেয়াদোত্তীর্ণ: ${task.title}` : `Overdue: ${task.title}`,
              body:
                language === 'bn'
                  ? 'এই কাজটির নির্ধারিত সময় পার হয়ে গেছে।'
                  : 'This task has passed its scheduled due time.',
              type: 'overdue',
            }).catch(() => {});
          }
        }
      });
    };

    evaluateReminders();
    const interval = window.setInterval(evaluateReminders, 60000);
    return () => window.clearInterval(interval);
  }, [user, tasks, notificationPrefs, language, browserPermission]);

  const setLanguage = useCallback(
    async (nextLang: Language) => {
      setLanguageState(nextLang);
      if (user && user.emailVerified) {
        await updateUserProfileFields(user.uid, { language: nextLang });
      }
    },
    [user]
  );

  const setTheme = useCallback(
    async (nextTheme: ThemeMode) => {
      setThemeState(nextTheme);
      if (user && user.emailVerified) {
        await updateUserProfileFields(user.uid, { theme: nextTheme });
      }
    },
    [user]
  );

  const loadMoreTasks = useCallback(() => {
    setTaskLimit((prev) => prev + 100);
  }, []);

  const requestBrowserNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await window.Notification.requestPermission();
    setBrowserPermission(perm);
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        profile,
        tasks,
        categories,
        projects,
        notificationPrefs,
        notifications,
        dataLoading,
        isOffline,
        language,
        theme,
        taskLimit,
        loadMoreTasks,
        setLanguage,
        setTheme,
        browserPermission,
        requestBrowserNotificationPermission,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
