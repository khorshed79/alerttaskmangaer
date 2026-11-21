import { Category, Language, Task } from '../types';
import { formatDate, toLocalDateKey } from './formatters';

export type AnalyticsRange = 'week' | 'month' | '30days' | 'custom';

export interface DashboardMetrics {
  todayTotal: number;
  todayCompleted: number;
  todayPending: number;
  todayPercentage: number;
  weeklySeries: { label: string; dateKey: string; completed: number; total: number }[];
}

export interface InsightsMetrics {
  completedThisWeek: number;
  completedThisMonth: number;
  pendingCount: number;
  overdueCount: number;
  completionRate: number;
  averageCompletionMinutes: number;
  highestProductivityDay: string;
  barSeries: { label: string; completed: number; pending: number }[];
  categoryBreakdown: { categoryId: string; name: string; color: string; count: number; percentage: number }[];
  trendSeries: { label: string; rate: number }[];
}

export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.isArchived) return false;
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  if (!task.dueAt) return false;
  return task.dueAt.getTime() < now.getTime();
}

export function calculateDashboardMetrics(
  tasks: Task[],
  lang: Language,
  now: Date = new Date()
): DashboardMetrics {
  const activeTasks = tasks.filter((item) => !item.isArchived && item.status !== 'cancelled');
  const todayKey = toLocalDateKey(now);

  const todayTasks = activeTasks.filter((item) => {
    if (item.dueAt && toLocalDateKey(item.dueAt) === todayKey) return true;
    if (item.completedAt && toLocalDateKey(item.completedAt) === todayKey) return true;
    return !item.dueAt && toLocalDateKey(item.createdAt) === todayKey;
  });

  const todayCompleted = todayTasks.filter((item) => item.status === 'completed').length;
  const todayTotal = todayTasks.length;
  const todayPending = Math.max(0, todayTotal - todayCompleted);
  const todayPercentage = todayTotal === 0 ? 0 : Math.round((todayCompleted / todayTotal) * 100);

  const weeklySeries: { label: string; dateKey: string; completed: number; total: number }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - offset);
    const key = toLocalDateKey(d);
    const dayTasks = activeTasks.filter((item) => {
      if (item.dueAt && toLocalDateKey(item.dueAt) === key) return true;
      if (item.completedAt && toLocalDateKey(item.completedAt) === key) return true;
      return false;
    });
    const completed = dayTasks.filter((item) => item.status === 'completed').length;
    const label = formatDate(d, lang, { weekday: 'short' }).slice(0, 3);
    weeklySeries.push({ label, dateKey: key, completed, total: dayTasks.length });
  }

  return {
    todayTotal,
    todayCompleted,
    todayPending,
    todayPercentage,
    weeklySeries,
  };
}

export function getRangeDates(
  range: AnalyticsRange,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date()
): { start: Date; end: Date } {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === 'week') {
    const day = start.getDay();
    const diffToMon = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMon);
  } else if (range === 'month') {
    start.setDate(1);
  } else if (range === '30days') {
    start.setDate(start.getDate() - 29);
  } else if (range === 'custom' && customStart && customEnd) {
    const s = new Date(customStart);
    const e = new Date(customEnd);
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return s <= e ? { start: s, end: e } : { start: e, end: s };
    }
  }
  return { start, end };
}

export function calculateInsightsMetrics(
  tasks: Task[],
  categories: Category[],
  range: AnalyticsRange,
  lang: Language,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date()
): InsightsMetrics {
  // Exclude cancelled & archived from completion denominator to prevent distortion
  const nonArchived = tasks.filter((item) => !item.isArchived);
  const { start, end } = getRangeDates(range, customStart, customEnd, now);

  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const wDay = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (wDay === 0 ? 6 : wDay - 1));

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const completedThisWeek = nonArchived.filter(
    (item) => item.status === 'completed' && item.completedAt && item.completedAt >= weekStart
  ).length;

  const completedThisMonth = nonArchived.filter(
    (item) => item.status === 'completed' && item.completedAt && item.completedAt >= monthStart
  ).length;

  const inRangeTasks = nonArchived.filter((item) => {
    if (item.status === 'cancelled') return false;
    const refDate = item.dueAt || item.completedAt || item.createdAt;
    return refDate >= start && refDate <= end;
  });

  const pendingCount = inRangeTasks.filter(
    (item) => item.status === 'pending' || item.status === 'in_progress'
  ).length;

  const overdueCount = inRangeTasks.filter((item) => isTaskOverdue(item, now)).length;
  const completedInRange = inRangeTasks.filter((item) => item.status === 'completed');
  const completionRate =
    inRangeTasks.length === 0 ? 0 : Math.round((completedInRange.length / inRangeTasks.length) * 100);

  const durationSamples = completedInRange.map((item) =>
    item.actualMinutes > 0 ? item.actualMinutes : item.estimatedMinutes
  );
  const averageCompletionMinutes =
    durationSamples.length === 0
      ? 0
      : Math.round(durationSamples.reduce((acc, v) => acc + v, 0) / durationSamples.length);

  // Peak productivity day by weekday across completed tasks in range
  const weekdayCounts = new Map<number, number>();
  completedInRange.forEach((item) => {
    const dt = item.completedAt || item.updatedAt;
    weekdayCounts.set(dt.getDay(), (weekdayCounts.get(dt.getDay()) ?? 0) + 1);
  });
  let bestDayIndex = -1;
  let bestDayScore = 0;
  weekdayCounts.forEach((count, dayIdx) => {
    if (count > bestDayScore) {
      bestDayScore = count;
      bestDayIndex = dayIdx;
    }
  });
  const highestProductivityDay =
    bestDayIndex === -1
      ? '—'
      : (() => {
          const ref = new Date(2026, 0, 4 + bestDayIndex); // Jan 4 2026 is Sunday
          return formatDate(ref, lang, { weekday: 'long' });
        })();

  // Bar series (last 7 buckets inside range)
  const totalDays = Math.max(1, Math.min(7, Math.ceil((end.getTime() - start.getTime()) / 86400000)));
  const barSeries: { label: string; completed: number; pending: number }[] = [];
  const trendSeries: { label: string; rate: number }[] = [];

  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const dayDate = new Date(end);
    dayDate.setDate(end.getDate() - i);
    const key = toLocalDateKey(dayDate);
    const bucket = inRangeTasks.filter((item) => {
      const ref = item.dueAt || item.completedAt || item.createdAt;
      return toLocalDateKey(ref) === key;
    });
    const comp = bucket.filter((b) => b.status === 'completed').length;
    const pend = bucket.length - comp;
    const label = formatDate(dayDate, lang, { month: 'short', day: 'numeric' });
    barSeries.push({ label, completed: comp, pending: pend });
    trendSeries.push({
      label: formatDate(dayDate, lang, { weekday: 'short' }).slice(0, 3),
      rate: bucket.length === 0 ? 0 : Math.round((comp / bucket.length) * 100),
    });
  }

  // Category distribution
  const catMap = new Map<string, number>();
  inRangeTasks.forEach((item) => {
    catMap.set(item.categoryId, (catMap.get(item.categoryId) ?? 0) + 1);
  });
  const categoryBreakdown = Array.from(catMap.entries())
    .map(([categoryId, count]) => {
      const cat = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        name: cat?.name ?? categoryId,
        color: cat?.color ?? '#6548F5',
        count,
        percentage: inRangeTasks.length === 0 ? 0 : Math.round((count / inRangeTasks.length) * 100),
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    completedThisWeek,
    completedThisMonth,
    pendingCount,
    overdueCount,
    completionRate,
    averageCompletionMinutes,
    highestProductivityDay,
    barSeries,
    categoryBreakdown,
    trendSeries,
  };
}

export function computeNextDueDate(baseDate: Date, rule: Task['repeatRule']): Date {
  const next = new Date(baseDate);
  if (rule === 'daily') next.setDate(next.getDate() + 1);
  if (rule === 'weekly') next.setDate(next.getDate() + 7);
  if (rule === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
}
