import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  FolderKanban,
  Plus,
} from 'lucide-react';
import { AppRoute, Task } from '../types';
import { useAppData } from '../contexts/AppDataContext';
import { t } from '../localization/translations';
import { calculateDashboardMetrics } from '../utils/analytics';
import { formatDate, formatDigits, toLocalDateKey } from '../utils/formatters';
import { CircularProgressRing, WeeklyMiniBars } from '../components/charts/Charts';
import { TaskRow } from '../components/tasks/TaskRow';
import { DashboardSkeleton } from '../components/common/Skeletons';
import { PWAInstallButton } from '../components/common/PWAInstallButton';

interface DashboardScreenProps {
  onNavigate: (route: AppRoute) => void;
  onAddTask: () => void;
  onSelectTask: (task: Task) => void;
  onToggleComplete: (task: Task) => Promise<void>;
  onToggleTimer: (task: Task) => Promise<void>;
}

export function DashboardScreen({
  onNavigate,
  onAddTask,
  onSelectTask,
  onToggleComplete,
  onToggleTimer,
}: DashboardScreenProps) {
  const { profile, tasks, categories, projects, notifications, dataLoading, language } = useAppData();

  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  const now = new Date();
  const metrics = calculateDashboardMetrics(tasks, language, now);
  const todayKey = toLocalDateKey(now);

  const todaysTasks = tasks
    .filter((item) => {
      if (item.isArchived || item.status === 'cancelled') return false;
      if (item.dueAt && toLocalDateKey(item.dueAt) === todayKey) return true;
      if (item.completedAt && toLocalDateKey(item.completedAt) === todayKey) return true;
      return !item.dueAt && toLocalDateKey(item.createdAt) === todayKey;
    })
    .slice(0, 6);

  const firstName = (profile?.displayName || 'Alex').split(' ')[0];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="w-12 h-12 rounded-2xl overflow-hidden border border-[#ECECF4] dark:border-[#242636] bg-white dark:bg-[#161822] shrink-0 cursor-pointer"
          >
            <img
              src={profile?.photoURL || '/src/assets/images/default_avatar_1795238348556.jpg'}
              alt={firstName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#88889A] dark:text-[#9496A8]">
              {formatDate(now, language, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-[#171725] dark:text-[#F4F4F8] truncate">
              {t(language, 'greetingPrefix')}, {firstName}
            </h1>
            <p className="text-xs text-[#88889A] dark:text-[#9496A8] truncate">
              {t(language, 'motivationalSub')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton lang={language} variant="compact" />
          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            aria-label={t(language, 'notificationsTitle')}
            className="relative min-h-[44px] min-w-[44px] rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] flex items-center justify-center text-[#171725] dark:text-[#F4F4F8] hover:border-[#6548F5] transition-colors cursor-pointer shrink-0"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E45D70] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {formatDigits(unreadCount > 9 ? '9+' : unreadCount, language)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Split: Hero Progress Card + Quick Actions / Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Today's Progress Gradient Card */}
        <section
          aria-label={t(language, 'todayProgress')}
          className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#6548F5] to-[#8067FF] text-white p-6 flex flex-col justify-between shadow-lg shadow-[#6548F5]/20"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-bold text-white/95">
                  {t(language, 'todayProgress')}
                </h2>
                <p className="text-xs text-white/75 mt-0.5 tabular-nums">
                  {formatDigits(metrics.todayCompleted, language)} /{' '}
                  {formatDigits(metrics.todayTotal, language)} {t(language, 'completedLabel')}
                </p>
              </div>

              <div className="flex items-center gap-5 pt-1">
                <div>
                  <div className="text-xl font-bold tabular-nums">
                    {formatDigits(metrics.todayCompleted, language)}
                  </div>
                  <div className="text-[11px] text-white/75">{t(language, 'completedLabel')}</div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <div className="text-xl font-bold tabular-nums">
                    {formatDigits(metrics.todayPending, language)}
                  </div>
                  <div className="text-[11px] text-white/75">{t(language, 'pendingLabel')}</div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <div className="text-xl font-bold tabular-nums">
                    {formatDigits(metrics.todayTotal, language)}
                  </div>
                  <div className="text-[11px] text-white/75">{t(language, 'totalLabel')}</div>
                </div>
              </div>
            </div>

            <CircularProgressRing
              percentage={metrics.todayPercentage}
              size={88}
              strokeWidth={8}
              lang={language}
              onDarkCard
            />
          </div>

          <div className="mt-5 pt-4 border-t border-white/15">
            <div className="text-xs font-semibold text-white/85 mb-1">
              {t(language, 'weeklyOverview')}
            </div>
            <WeeklyMiniBars series={metrics.weeklySeries} lang={language} />
          </div>
        </section>

        {/* Right Column: Quick Actions + Active Projects Summary */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <section aria-label={t(language, 'quickActions')}>
            <h2 className="text-sm font-bold text-[#171725] dark:text-[#F4F4F8] mb-3">
              {t(language, 'quickActions')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onAddTask}
                className="min-h-[68px] p-3.5 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] hover:border-[#6548F5] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <span className="w-10 h-10 rounded-xl bg-[#6548F5]/12 text-[#6548F5] flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-[#171725] dark:text-[#F4F4F8]">
                  {t(language, 'addNewTask')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="min-h-[68px] p-3.5 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] hover:border-[#6548F5] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <span className="w-10 h-10 rounded-xl bg-[#36B98A]/12 text-[#36B98A] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-[#171725] dark:text-[#F4F4F8]">
                  {t(language, 'viewCalendar')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('insights')}
                className="min-h-[68px] p-3.5 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] hover:border-[#6548F5] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <span className="w-10 h-10 rounded-xl bg-[#F3AD55]/14 text-[#F3AD55] flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-[#171725] dark:text-[#F4F4F8]">
                  {t(language, 'viewInsights')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="min-h-[68px] p-3.5 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] hover:border-[#6548F5] flex items-center gap-3 text-left transition-colors cursor-pointer"
              >
                <span className="w-10 h-10 rounded-xl bg-[#8067FF]/12 text-[#8067FF] flex items-center justify-center shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </span>
                <span className="text-xs font-semibold text-[#171725] dark:text-[#F4F4F8]">
                  {t(language, 'viewAllTasks')}
                </span>
              </button>
            </div>
          </section>

          {/* Projects Quick Strip */}
          <section className="rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-[#88889A] dark:text-[#9496A8] flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-[#6548F5]" />
                {t(language, 'projectsTab')}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('categories')}
                className="text-xs font-semibold text-[#6548F5] hover:underline cursor-pointer"
              >
                {t(language, 'viewAll')}
              </button>
            </div>
            <div className="space-y-2.5">
              {projects
                .filter((p) => !p.isArchived)
                .slice(0, 2)
                .map((proj) => {
                  const projTasks = tasks.filter((tk) => tk.projectId === proj.id && !tk.isArchived);
                  const done = projTasks.filter((tk) => tk.status === 'completed').length;
                  const pct = projTasks.length === 0 ? 0 : Math.round((done / projTasks.length) * 100);
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => onNavigate('categories')}
                      className="w-full text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-[#171725] dark:text-[#F4F4F8] truncate">
                          {proj.name}
                        </span>
                        <span className="text-[#88889A] tabular-nums">
                          {formatDigits(done, language)}/{formatDigits(projTasks.length, language)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#F8F8FC] dark:bg-[#242636] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: proj.color }}
                        />
                      </div>
                    </button>
                  );
                })}
            </div>
          </section>
        </div>
      </div>

      {/* Today's Tasks Section */}
      <section aria-label={t(language, 'todaysTasks')}>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]">
            {t(language, 'todaysTasks')}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6548F5] dark:text-[#8067FF] hover:underline cursor-pointer"
          >
            {t(language, 'viewAll')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todaysTasks.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-8 text-center">
            <p className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]">
              {t(language, 'noTasksTodayTitle')}
            </p>
            <p className="text-sm text-[#88889A] dark:text-[#9496A8] mt-1.5 max-w-sm mx-auto">
              {t(language, 'noTasksTodayBody')}
            </p>
            <button
              type="button"
              onClick={onAddTask}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t(language, 'addNewTask')}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todaysTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                category={categories.find((c) => c.id === task.categoryId)}
                project={projects.find((p) => p.id === task.projectId)}
                lang={language}
                onToggleComplete={onToggleComplete}
                onToggleTimer={onToggleTimer}
                onSelect={onSelectTask}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
