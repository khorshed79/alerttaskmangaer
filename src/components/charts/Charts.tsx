import { Language } from '../../types';
import { formatDigits } from '../../utils/formatters';

export function CircularProgressRing({
  percentage,
  size = 86,
  strokeWidth = 8,
  lang,
  onDarkCard = false,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  lang: Language;
  onDarkCard?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${clamped}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={onDarkCard ? 'rgba(255,255,255,0.22)' : '#ECECF4'}
          className={onDarkCard ? '' : 'dark:stroke-[#26293B]'}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={onDarkCard ? '#FFFFFF' : '#6548F5'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 450ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <span
        className={`absolute text-base font-bold tabular-nums ${
          onDarkCard ? 'text-white' : 'text-[#171725] dark:text-[#F4F4F8]'
        }`}
      >
        {formatDigits(clamped, lang)}%
      </span>
    </div>
  );
}

export function WeeklyMiniBars({
  series,
  lang,
}: {
  series: { label: string; completed: number; total: number }[];
  lang: Language;
}) {
  const maxVal = Math.max(1, ...series.map((d) => d.total));

  return (
    <div className="flex items-end justify-between gap-2 h-20 pt-2">
      {series.map((item, idx) => {
        const totalPct = Math.round((item.total / maxVal) * 100);
        const compPct = item.total === 0 ? 0 : Math.round((item.completed / maxVal) * 100);
        return (
          <div key={`${item.label}-${idx}`} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div className="w-full max-w-[16px] h-12 rounded-full bg-white/15 relative overflow-hidden flex items-end">
              {item.total > 0 && (
                <div
                  className="w-full rounded-full bg-white/30 absolute bottom-0 left-0 right-0"
                  style={{ height: `${Math.max(14, totalPct)}%` }}
                />
              )}
              {item.completed > 0 && (
                <div
                  className="w-full rounded-full bg-white relative z-10"
                  style={{
                    height: `${Math.max(14, compPct)}%`,
                    transition: 'height 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              )}
            </div>
            <span className="text-[11px] font-medium text-white/85 tabular-nums">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ActivityBarChart({
  series,
  lang,
  completedLabel,
  pendingLabel,
}: {
  series: { label: string; completed: number; pending: number }[];
  lang: Language;
  completedLabel: string;
  pendingLabel: string;
}) {
  const maxVal = Math.max(1, ...series.map((s) => s.completed + s.pending));

  return (
    <div>
      <div className="flex items-center gap-5 text-xs text-[#88889A] dark:text-[#9496A8] mb-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#6548F5]" />
          {completedLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#ECECF4] dark:bg-[#2A2D3E]" />
          {pendingLabel}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4">
        {series.map((item, idx) => {
          const total = item.completed + item.pending;
          const compH = Math.round((item.completed / maxVal) * 120);
          const pendH = Math.round((item.pending / maxVal) * 120);
          return (
            <div key={`${item.label}-${idx}`} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[11px] font-medium text-[#88889A] dark:text-[#9496A8] tabular-nums">
                {formatDigits(total, lang)}
              </span>
              <div className="w-full max-w-[28px] flex flex-col justify-end rounded-lg overflow-hidden bg-[#F8F8FC] dark:bg-[#1E2130]">
                {pendH > 0 && (
                  <div
                    className="w-full bg-[#DCD8F8] dark:bg-[#2E3248]"
                    style={{ height: `${Math.max(4, pendH)}px` }}
                  />
                )}
                {compH > 0 && (
                  <div
                    className="w-full bg-[#6548F5]"
                    style={{ height: `${Math.max(4, compH)}px` }}
                  />
                )}
                {total === 0 && <div className="w-full h-1 bg-[#ECECF4] dark:bg-[#242636]" />}
              </div>
              <span className="text-[11px] text-[#88889A] dark:text-[#9496A8] truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryDonutChart({
  items,
  lang,
  totalLabel,
}: {
  items: { categoryId: string; name: string; color: string; count: number; percentage: number }[];
  lang: Language;
  totalLabel: string;
}) {
  const total = items.reduce((acc, i) => acc + i.count, 0);
  const size = 148;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ECECF4"
            className="dark:stroke-[#242636]"
            strokeWidth={strokeWidth}
          />
          {total > 0 &&
            items.map((item) => {
              const fraction = item.count / total;
              const segmentLen = fraction * circumference;
              const offset = -accumulated * circumference;
              accumulated += fraction;
              return (
                <circle
                  key={item.categoryId}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segmentLen} ${circumference}`}
                  strokeDashoffset={offset}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8] tabular-nums">
            {formatDigits(total, lang)}
          </span>
          <span className="text-[11px] text-[#88889A] dark:text-[#9496A8]">{totalLabel}</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {items.slice(0, 6).map((item) => (
          <div key={item.categoryId} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#171725] dark:text-[#F4F4F8] font-medium truncate">
                {item.name}
              </span>
            </div>
            <span className="text-xs text-[#88889A] dark:text-[#9496A8] tabular-nums shrink-0">
              {formatDigits(item.count, lang)} · {formatDigits(item.percentage, lang)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductivityTrendChart({
  series,
  lang,
}: {
  series: { label: string; rate: number }[];
  lang: Language;
}) {
  const width = 320;
  const height = 120;
  const padX = 16;
  const padY = 14;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = series.map((item, idx) => {
    const x =
      series.length <= 1 ? padX + innerW / 2 : padX + (idx / (series.length - 1)) * innerW;
    const y = padY + innerH - (item.rate / 100) * innerH;
    return { x, y, ...item };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `M ${points[0].x},${padY + innerH} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${
          points[points.length - 1].x
        },${padY + innerH} Z`
      : '';

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#36B98A" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#36B98A" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <line
          x1={padX}
          y1={padY + innerH}
          x2={width - padX}
          y2={padY + innerH}
          stroke="#ECECF4"
          className="dark:stroke-[#242636]"
          strokeWidth="1"
        />
        {areaPath && <path d={areaPath} fill="url(#trendGrad)" />}
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="#36B98A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}
        {points.map((p, idx) => (
          <g key={`${p.label}-${idx}`}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#36B98A" />
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between px-2 mt-1">
        {series.map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="text-center">
            <div className="text-[11px] font-medium text-[#171725] dark:text-[#F4F4F8] tabular-nums">
              {formatDigits(item.rate, lang)}%
            </div>
            <div className="text-[10px] text-[#88889A] dark:text-[#9496A8]">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
