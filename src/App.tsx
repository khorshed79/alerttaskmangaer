/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  FolderKanban,
  Home,
  Moon,
  Plus,
  Sun,
  User as UserIcon,
  WifiOff,
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import { AppRoute, Task } from './types';
import { t } from './localization/translations';
import {
  createTask,
  deleteTask,
  duplicateTask,
  TaskInputPayload,
  toggleTaskArchive,
  toggleTaskCompletion,
  toggleTaskTimer,
  updateTask,
  updateTaskSubtasks,
} from './services/firebase/firestoreService';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  AuthScreen,
  EmailVerificationScreen,
  OnboardingScreen,
  ProfileSetupScreen,
  SplashScreen,
} from './screens/AuthFlowScreens';
import { DashboardScreen } from './screens/DashboardScreen';
import { TasksScreen } from './screens/TasksScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { CategoriesProjectsScreen } from './screens/CategoriesProjectsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { TaskDetailsModal } from './components/tasks/TaskDetailsModal';

function AuthenticatedWorkspace() {
  const { user } = useAuth();
  const {
    profile,
    tasks,
    categories,
    projects,
    isOffline,
    language,
    setLanguage,
    theme,
    setTheme,
  } = useAppData();

  const [route, setRoute] = useState<AppRoute>('home');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formDefaultDate, setFormDefaultDate] = useState<Date | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  if (!user) return null;

  const selectedTask = selectedTaskId
    ? tasks.find((tk) => tk.id === selectedTaskId) ?? null
    : null;

  const openNewTask = (date?: Date) => {
    setEditingTask(null);
    setFormDefaultDate(date ?? null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: TaskInputPayload, existingId?: string) => {
    if (existingId) {
      await updateTask(user.uid, existingId, payload);
    } else {
      await createTask(user.uid, payload);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    await toggleTaskCompletion(user.uid, task);
  };

  const handleToggleTimer = async (task: Task) => {
    await toggleTaskTimer(user.uid, task);
  };

  const desktopNavItems: { key: AppRoute; label: string; icon: typeof Home }[] = [
    { key: 'home', label: t(language, 'navHome'), icon: Home },
    { key: 'tasks', label: t(language, 'navTasks'), icon: CheckSquare },
    { key: 'calendar', label: t(language, 'navCalendar'), icon: CalendarDays },
    { key: 'insights', label: t(language, 'navInsights'), icon: BarChart3 },
    { key: 'categories', label: t(language, 'navCategories'), icon: FolderKanban },
    { key: 'notifications', label: t(language, 'navNotifications'), icon: Bell },
    { key: 'profile', label: t(language, 'navProfile'), icon: UserIcon },
  ];

  return (
    <div className="min-h-screen flex bg-[#F8F8FC] dark:bg-[#0D0E14] text-[#171725] dark:text-[#F4F4F8]">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col justify-between border-r border-[#ECECF4] dark:border-[#242636] bg-white dark:bg-[#161822] p-5 sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-2.5 px-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6548F5] to-[#8067FF] flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">{t(language, 'appName')}</span>
          </div>

          <button
            type="button"
            onClick={() => openNewTask()}
            className="w-full min-h-[46px] rounded-2xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#6548F5]/20 mb-6 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t(language, 'addNewTask')}
          </button>

          <nav className="space-y-1" aria-label="Primary Navigation">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const active = route === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRoute(item.key)}
                  className={`w-full min-h-[44px] px-3.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#6548F5]/10 text-[#6548F5] dark:text-[#8067FF] font-semibold'
                      : 'text-[#88889A] dark:text-[#9496A8] hover:bg-[#F8F8FC] dark:hover:bg-[#1E2130] hover:text-[#171725] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#ECECF4] dark:border-[#242636] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="px-3 py-2 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] text-xs font-semibold text-[#171725] dark:text-[#F4F4F8] cursor-pointer"
          >
            {language === 'en' ? 'বাংলা' : 'English'}
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
            className="min-h-[38px] min-w-[38px] rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] flex items-center justify-center text-[#171725] dark:text-[#F4F4F8] cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 pb-24 md:pb-10">
        {isOffline && (
          <div className="bg-[#F3AD55]/15 border-b border-[#F3AD55]/30 px-4 py-2 text-xs font-medium text-[#B97214] dark:text-[#F3AD55] flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            {t(language, 'offlineBanner')}
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {route === 'home' && (
            <DashboardScreen
              onNavigate={setRoute}
              onAddTask={() => openNewTask()}
              onSelectTask={(tk) => setSelectedTaskId(tk.id)}
              onToggleComplete={handleToggleComplete}
              onToggleTimer={handleToggleTimer}
            />
          )}
          {route === 'tasks' && (
            <TasksScreen
              onAddTask={() => openNewTask()}
              onSelectTask={(tk) => setSelectedTaskId(tk.id)}
              onToggleComplete={handleToggleComplete}
              onToggleTimer={handleToggleTimer}
            />
          )}
          {route === 'calendar' && (
            <CalendarScreen
              onAddTaskForDate={(date) => openNewTask(date)}
              onSelectTask={(tk) => setSelectedTaskId(tk.id)}
              onToggleComplete={handleToggleComplete}
              onToggleTimer={handleToggleTimer}
            />
          )}
          {route === 'insights' && <InsightsScreen />}
          {route === 'categories' && <CategoriesProjectsScreen />}
          {route === 'notifications' && <NotificationsScreen />}
          {route === 'profile' && <ProfileScreen onNavigate={setRoute} />}
        </div>
      </main>

      {/* Mobile 5-Tab Bottom Navigation with Centered Purple Circular Add Button */}
      <nav
        aria-label="Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#161822]/95 backdrop-blur-md border-t border-[#ECECF4] dark:border-[#242636] grid grid-cols-5 items-center px-2"
      >
        <button
          type="button"
          onClick={() => setRoute('home')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            route === 'home' ? 'text-[#6548F5] dark:text-[#8067FF]' : 'text-[#88889A]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{t(language, 'navHome')}</span>
        </button>

        <button
          type="button"
          onClick={() => setRoute('tasks')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            route === 'tasks' ? 'text-[#6548F5] dark:text-[#8067FF]' : 'text-[#88889A]'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{t(language, 'navTasks')}</span>
        </button>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => openNewTask()}
            aria-label={t(language, 'navAdd')}
            className="-mt-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#6548F5] to-[#8067FF] text-white flex items-center justify-center shadow-lg shadow-[#6548F5]/35 active:scale-95 transition-transform cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setRoute('calendar')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            route === 'calendar' ? 'text-[#6548F5] dark:text-[#8067FF]' : 'text-[#88889A]'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{t(language, 'navCalendar')}</span>
        </button>

        <button
          type="button"
          onClick={() => setRoute('profile')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            route === 'profile' ? 'text-[#6548F5] dark:text-[#8067FF]' : 'text-[#88889A]'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{t(language, 'navProfile')}</span>
        </button>
      </nav>

      {/* Modals */}
      <TaskFormModal
        open={formOpen}
        lang={language}
        categories={categories}
        projects={projects}
        initialTask={editingTask}
        defaultDate={formDefaultDate}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <TaskDetailsModal
        task={selectedTask}
        category={
          selectedTask ? categories.find((c) => c.id === selectedTask.categoryId) : undefined
        }
        project={
          selectedTask ? projects.find((p) => p.id === selectedTask.projectId) : undefined
        }
        lang={language}
        onClose={() => setSelectedTaskId(null)}
        onEdit={(tk) => {
          setSelectedTaskId(null);
          setEditingTask(tk);
          setFormOpen(true);
        }}
        onToggleComplete={handleToggleComplete}
        onToggleTimer={handleToggleTimer}
        onUpdateSubtasks={(taskId, subtasks) => updateTaskSubtasks(user.uid, taskId, subtasks)}
        onDuplicate={async (tk) => {
          await duplicateTask(user.uid, tk);
        }}
        onArchiveToggle={(tk) => toggleTaskArchive(user.uid, tk)}
        onDelete={(taskId) => deleteTask(user.uid, taskId)}
      />

      {/* Keep profile synced without warning */}
      {profile === null ? null : null}
    </div>
  );
}

function RootRouter() {
  const { user, authReady } = useAuth();
  const { profile, dataLoading } = useAppData();
  const [introDone, setIntroDone] = useState(
    () => localStorage.getItem('taskflow_intro_done') === 'true'
  );

  if (!authReady) {
    return <SplashScreen />;
  }

  if (!user) {
    if (!introDone) {
      return (
        <OnboardingScreen
          onFinish={() => {
            localStorage.setItem('taskflow_intro_done', 'true');
            setIntroDone(true);
          }}
        />
      );
    }
    return <AuthScreen />;
  }

  if (!user.emailVerified) {
    return <EmailVerificationScreen />;
  }

  if (dataLoading) {
    return <SplashScreen />;
  }

  if (profile && !profile.onboarded) {
    return <ProfileSetupScreen />;
  }

  return <AuthenticatedWorkspace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppDataProvider>
          <RootRouter />
        </AppDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
