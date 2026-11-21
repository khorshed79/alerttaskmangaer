import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { useAppData } from '../contexts/AppDataContext';
import { t } from '../localization/translations';
import { formatDate, formatDigits, toLocalDateKey } from '../utils/formatters';
import { isTaskOverdue } from '../utils/analytics';
import { TaskRow } from '../components/tasks/TaskRow';

type CalendarMode = 'month' | 'week' | 'agenda';

interface CalendarScreenProps {
  onAddTaskForDate: (date: Date) => void;
  onSelectTask: (task: Task) => void;
  onToggleComplete: (task: Task) => Promise<void>;
  onToggleTimer: (task: Task) => Promise<void>;
}

export function CalendarScreen({
  onAddTaskForDate,
  onSelectTask,
  onToggleComplete,
  onToggleTimer,
}: CalendarScreenProps) {
  const { tasks, categories, projects, language } = useAppData();
  const [viewMode, setViewMode] = useState<CalendarMode>('month');
  const [cursorMonth, setCursorMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');

  const activeTasks = useMemo(
    () =>
      tasks.filter((tk) => {
        if (tk.isArchived) return false;
        if (categoryFilter !== 'all' && tk.categoryId !== categoryFilter) return false;
        if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
        return true;
      }),
    [tasks, categoryFilter, statusFilter]
  );

  const tasksByDateKey = useMemo(() => {
    const map = new Map<string, Task[]>();
    activeTasks.forEach((tk) => {
      const ref = tk.dueAt || tk.startAt || tk.createdAt;
      const key = toLocalDateKey(ref);
      const list = map.get(key) ?? [];
      list.push(tk);
      map.set(key, list);
    });
    return map;
  }, [activeTasks]);

  const monthDays = useMemo(() => {
    const year = cursorMonth.getFullYear();
    const month = cursorMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0=Sun
    const gridStart = new Date(year, month, 1 - startOffset);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
      const cell = new Date(gridStart);
      cell.setDate(gridStart.getDate() + i);
      cells.push(cell);
    }
    return cells;
  }, [cursorMonth]);

  const weekDays = useMemo(() => {
    const ref = new Date(selectedDate);
    const day = ref.getDay();
    const start = new Date(ref);
    start.setDate(ref.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const selectedKey = toLocalDateKey(selectedDate);
  const selectedTasks = useMemo(() => {
    const list = tasksByDateKey.get(selectedKey) ?? [];
    return [...list].sort((a, b) => {
      const at = a.dueAt ? a.dueAt.getTime() : 0;
      const bt = b.dueAt ? b.dueAt.getTime() : 0;
      return at - bt;
    });
  }, [tasksByDateKey, selectedKey]);

  const overdueTasks = useMemo(
    () => activeTasks.filter((tk) => isTaskOverdue(tk)).slice(0, 6),
    [activeTasks]
  );

  const upcomingTasks = useMemo(() => {
    const nowMs = Date.now();
    return activeTasks
      .filter((tk) => tk.status !== 'completed' && tk.status !== 'cancelled' && tk.dueAt && tk.dueAt.getTime() >= nowMs)
      .sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0))
      .slice(0, 6);
  }, [activeTasks]);

  const weekdayHeaders = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2026, 0, 4 + i);
      return formatDate(d, language, { weekday: 'short' }).slice(0, 3);
    });
  }, [language]);

  const todayKey = toLocalDateKey(new Date());

  return (
    <div className="space-y-5">
      {/* Header & Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8]">
          {t(language, 'calendarTitle')}
        </h1>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636]">
          {(['month', 'week', 'agenda'] as CalendarMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === m
                  ? 'bg-[#6548F5] text-white'
                  : 'text-[#88889A] dark:text-[#9496A8] hover:text-[#171725] dark:hover:text-white'
              }`}
            >
              {m === 'month'
                ? t(language, 'monthView')
                : m === 'week'
                ? t(language, 'weekView')
                : t(language, 'dayView')}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-xs font-medium text-[#171725] dark:text-[#F4F4F8]"
          >
            <option value="all">{t(language, 'allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-xs font-medium text-[#171725] dark:text-[#F4F4F8]"
          >
            <option value="all">{t(language, 'filterAll')}</option>
            <option value="pending">{t(language, 'statusPending')}</option>
            <option value="in_progress">{t(language, 'statusInProgress')}</option>
            <option value="completed">{t(language, 'statusCompleted')}</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => onAddTaskForDate(selectedDate)}
          className="min-h-[40px] px-4 rounded-xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t(language, 'addTaskOnDate')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Calendar Grid Panel */}
        {viewMode !== 'agenda' && (
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]">
                {formatDate(viewMode === 'month' ? cursorMonth : selectedDate, language, {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setSelectedDate(today);
                    setCursorMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#F8F8FC] dark:bg-[#222534] text-xs font-semibold text-[#6548F5] dark:text-[#8067FF] cursor-pointer"
                >
                  {t(language, 'todayBtn')}
                </button>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => {
                    if (viewMode === 'month') {
                      setCursorMonth(
                        new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() - 1, 1)
                      );
                    } else {
                      const prev = new Date(selectedDate);
                      prev.setDate(prev.getDate() - 7);
                      setSelectedDate(prev);
                    }
                  }}
                  className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[#171725] dark:text-[#F4F4F8] hover:bg-[#F8F8FC] dark:hover:bg-[#222534] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => {
                    if (viewMode === 'month') {
                      setCursorMonth(
                        new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 1)
                      );
                    } else {
                      const next = new Date(selectedDate);
                      next.setDate(next.getDate() + 7);
                      setSelectedDate(next);
                    }
                  }}
                  className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-[#171725] dark:text-[#F4F4F8] hover:bg-[#F8F8FC] dark:hover:bg-[#222534] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {weekdayHeaders.map((w, idx) => (
                <div key={idx} className="text-[11px] font-semibold text-[#88889A] dark:text-[#9496A8] py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {(viewMode === 'month' ? monthDays : weekDays).map((dayDate) => {
                const key = toLocalDateKey(dayDate);
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;
                const inMonth = dayDate.getMonth() === cursorMonth.getMonth();
                const dayTasks = tasksByDateKey.get(key) ?? [];

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(dayDate)}
                    className={`min-h-[48px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#6548F5] text-white'
                        : isToday
                        ? 'bg-[#6548F5]/12 text-[#6548F5] dark:text-[#8067FF]'
                        : inMonth || viewMode === 'week'
                        ? 'hover:bg-[#F8F8FC] dark:hover:bg-[#222534] text-[#171725] dark:text-[#F4F4F8]'
                        : 'text-[#88889A]/45 dark:text-[#9496A8]/40'
                    }`}
                  >
                    <span className="text-xs font-semibold tabular-nums">
                      {formatDigits(dayDate.getDate(), language)}
                    </span>
                    <div className="flex items-center gap-0.5 h-1.5">
                      {dayTasks.slice(0, 3).map((tk) => {
                        const cat = categories.find((c) => c.id === tk.categoryId);
                        return (
                          <span
                            key={tk.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: isSelected ? '#FFFFFF' : cat?.color ?? '#6548F5',
                            }}
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Day Agenda & Upcoming/Overdue */}
        <div className={`${viewMode === 'agenda' ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-5`}>
          <section className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-bold text-[#171725] dark:text-[#F4F4F8]">
                {formatDate(selectedDate, language, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </h2>
              <span className="text-xs text-[#88889A] tabular-nums">
                {formatDigits(selectedTasks.length, language)} {t(language, 'tasksCountLabel')}
              </span>
            </div>

            {selectedTasks.length === 0 ? (
              <p className="text-sm text-[#88889A] dark:text-[#9496A8] py-4 text-center">
                {t(language, 'noEventsOnDate')}
              </p>
            ) : (
              <div className="space-y-2.5">
                {selectedTasks.map((task) => (
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

          {overdueTasks.length > 0 && (
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold text-[#E45D70] px-1">
                {t(language, 'overdueTasks')} ({formatDigits(overdueTasks.length, language)})
              </h3>
              {overdueTasks.map((task) => (
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
            </section>
          )}

          {upcomingTasks.length > 0 && (
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold text-[#88889A] dark:text-[#9496A8] px-1">
                {t(language, 'upcomingTasks')}
              </h3>
              {upcomingTasks.map((task) => (
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
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
