import { useMemo, useState } from 'react';
import { Award, CheckCircle2, Clock, Flame } from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import { t } from '../localization/translations';
import { AnalyticsRange, calculateInsightsMetrics } from '../utils/analytics';
import { formatDigits, formatDuration, toLocalDateKey } from '../utils/formatters';
import {
  ActivityBarChart,
  CategoryDonutChart,
  ProductivityTrendChart,
} from '../components/charts/Charts';

export function InsightsScreen() {
  const { tasks, categories, language } = useAppData();
  const [range, setRange] = useState<AnalyticsRange>('week');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return toLocalDateKey(d);
  });
  const [customEnd, setCustomEnd] = useState(() => toLocalDateKey(new Date()));

  const metrics = useMemo(
    () =>
      calculateInsightsMetrics(tasks, categories, range, language, customStart, customEnd),
    [tasks, categories, range, language, customStart, customEnd]
  );

  const ranges: { key: AnalyticsRange; label: string }[] = [
    { key: 'week', label: t(language, 'rangeWeek') },
    { key: 'month', label: t(language, 'rangeMonth') },
    { key: '30days', label: t(language, 'range30Days') },
    { key: 'custom', label: t(language, 'rangeCustom') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8]">
          {t(language, 'insightsTitle')}
        </h1>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] overflow-x-auto">
          {ranges.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                range === r.key
                  ? 'bg-[#6548F5] text-white'
                  : 'text-[#88889A] dark:text-[#9496A8] hover:text-[#171725] dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-4">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-xs text-[#171725] dark:text-[#F4F4F8]"
          />
          <span className="text-xs text-[#88889A]">→</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-xs text-[#171725] dark:text-[#F4F4F8]"
          />
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-4">
          <div className="flex items-center justify-between text-xs text-[#88889A] dark:text-[#9496A8]">
            <span>{t(language, 'completedThisWeek')}</span>
            <CheckCircle2 className="w-4 h-4 text-[#36B98A]" />
          </div>
          <div className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8] tabular-nums mt-2">
            {formatDigits(metrics.completedThisWeek, language)}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-4">
          <div className="flex items-center justify-between text-xs text-[#88889A] dark:text-[#9496A8]">
            <span>{t(language, 'completedThisMonth')}</span>
            <Award className="w-4 h-4 text-[#6548F5]" />
          </div>
          <div className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8] tabular-nums mt-2">
            {formatDigits(metrics.completedThisMonth, language)}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-4">
          <div className="flex items-center justify-between text-xs text-[#88889A] dark:text-[#9496A8]">
            <span>{t(language, 'completionRate')}</span>
            <Flame className="w-4 h-4 text-[#F3AD55]" />
          </div>
          <div className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8] tabular-nums mt-2">
            {formatDigits(metrics.completionRate, language)}%
          </div>
          <p className="text-[11px] text-[#88889A] mt-1 tabular-nums">
            {t(language, 'pendingLabel')}: {formatDigits(metrics.pendingCount, language)} ·{' '}
            {t(language, 'overdueTasks')}: {formatDigits(metrics.overdueCount, language)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-4">
          <div className="flex items-center justify-between text-xs text-[#88889A] dark:text-[#9496A8]">
            <span>{t(language, 'avgCompletionTime')}</span>
            <Clock className="w-4 h-4 text-[#8067FF]" />
          </div>
          <div className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8] tabular-nums mt-2">
            {formatDuration(metrics.averageCompletionMinutes, language)}
          </div>
          <p className="text-[11px] text-[#88889A] mt-1 truncate">
            {t(language, 'highestProductivityDay')}: {metrics.highestProductivityDay}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5">
          <h2 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8] mb-3">
            {t(language, 'dailyWeeklyActivity')}
          </h2>
          <ActivityBarChart
            series={metrics.barSeries}
            lang={language}
            completedLabel={t(language, 'completedLabel')}
            pendingLabel={t(language, 'pendingLabel')}
          />
        </section>

        <section className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5">
          <h2 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8] mb-4">
            {t(language, 'categoryDistribution')}
          </h2>
          {metrics.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-[#88889A] py-10 text-center">
              {t(language, 'noAnalyticsData')}
            </p>
          ) : (
            <CategoryDonutChart
              items={metrics.categoryBreakdown}
              lang={language}
              totalLabel={t(language, 'totalLabel')}
            />
          )}
        </section>

        <section className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5">
          <h2 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8] mb-3">
            {t(language, 'productivityTrend')}
          </h2>
          <ProductivityTrendChart series={metrics.trendSeries} lang={language} />
        </section>
      </div>
    </div>
  );
}
