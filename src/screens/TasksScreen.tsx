import { useMemo, useState } from 'react';
import { ArrowUpDown, Plus, Search } from 'lucide-react';
import { Task, TaskPriority } from '../types';
import { useAppData } from '../contexts/AppDataContext';
import { t } from '../localization/translations';
import { isTaskOverdue } from '../utils/analytics';
import { formatDigits } from '../utils/formatters';
import { TaskRow } from '../components/tasks/TaskRow';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'archived';
type SortOption = 'due' | 'priority' | 'created';

interface TasksScreenProps {
  onAddTask: () => void;
  onSelectTask: (task: Task) => void;
  onToggleComplete: (task: Task) => Promise<void>;
  onToggleTimer: (task: Task) => Promise<void>;
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function TasksScreen({
  onAddTask,
  onSelectTask,
  onToggleComplete,
  onToggleTimer,
}: TasksScreenProps) {
  const { tasks, categories, projects, language, taskLimit, loadMoreTasks } = useAppData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [sortBy, setSortBy] = useState<SortOption>('due');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tasks.filter((item) => {
      if (statusFilter === 'archived') {
        if (!item.isArchived) return false;
      } else {
        if (item.isArchived) return false;
        if (statusFilter === 'pending' && item.status !== 'pending') return false;
        if (statusFilter === 'in_progress' && item.status !== 'in_progress') return false;
        if (statusFilter === 'completed' && item.status !== 'completed') return false;
        if (statusFilter === 'overdue' && !isTaskOverdue(item)) return false;
      }

      if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      if (q) {
        const hay = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'priority') {
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      }
      if (sortBy === 'created') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      const aDue = a.dueAt ? a.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueAt ? b.dueAt.getTime() : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });
  }, [tasks, search, statusFilter, categoryFilter, priorityFilter, sortBy]);

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t(language, 'filterAll') },
    { key: 'pending', label: t(language, 'filterPending') },
    { key: 'in_progress', label: t(language, 'filterInProgress') },
    { key: 'completed', label: t(language, 'filterCompleted') },
    { key: 'overdue', label: t(language, 'filterOverdue') },
    { key: 'archived', label: t(language, 'filterArchived') },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8]">
            {t(language, 'allTasksTitle')}
          </h1>
          <p className="text-xs text-[#88889A] dark:text-[#9496A8] tabular-nums mt-0.5">
            {formatDigits(filtered.length, language)} {t(language, 'tasksCountLabel')}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTask}
          className="min-h-[44px] px-4 rounded-2xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {t(language, 'addNewTask')}
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#88889A] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(language, 'searchPlaceholder')}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
          />
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`min-h-[38px] px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#6548F5] text-white'
                  : 'bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-[#88889A] dark:text-[#9496A8] hover:text-[#171725] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label={t(language, 'categoryLabel')}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-xs font-medium text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
          >
            <option value="all">{t(language, 'allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
            aria-label={t(language, 'priorityLabel')}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-xs font-medium text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
          >
            <option value="all">{t(language, 'allPriorities')}</option>
            <option value="urgent">{t(language, 'priorityUrgent')}</option>
            <option value="high">{t(language, 'priorityHigh')}</option>
            <option value="medium">{t(language, 'priorityMedium')}</option>
            <option value="low">{t(language, 'priorityLow')}</option>
          </select>

          <div className="relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#88889A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label={t(language, 'sortBy')}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-xs font-medium text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
            >
              <option value="due">
                {t(language, 'sortBy')}: {t(language, 'sortDueDate')}
              </option>
              <option value="priority">
                {t(language, 'sortBy')}: {t(language, 'sortPriority')}
              </option>
              <option value="created">
                {t(language, 'sortBy')}: {t(language, 'sortCreated')}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-10 text-center">
          <p className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]">
            {t(language, 'emptyTasksTitle')}
          </p>
          <p className="text-sm text-[#88889A] dark:text-[#9496A8] mt-1.5">
            {t(language, 'emptyTasksBody')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((task) => (
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
          {tasks.length >= taskLimit && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={loadMoreTasks}
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-xs font-semibold text-[#6548F5] hover:border-[#6548F5] cursor-pointer"
              >
                Load more tasks
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
