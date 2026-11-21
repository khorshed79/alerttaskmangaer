import { Check, Clock, Flag, Pause, Play, Repeat } from 'lucide-react';
import { Category, Language, Project, Task } from '../../types';
import { t } from '../../localization/translations';
import { formatDate, formatDigits, formatDuration, formatTime } from '../../utils/formatters';
import { isTaskOverdue } from '../../utils/analytics';
import { CategoryIcon } from '../common/CategoryIcon';

interface TaskRowProps {
  task: Task;
  category?: Category;
  project?: Project;
  lang: Language;
  onToggleComplete: (task: Task) => void;
  onToggleTimer: (task: Task) => void;
  onSelect: (task: Task) => void;
}

export function TaskRow({
  task,
  category,
  project,
  lang,
  onToggleComplete,
  onToggleTimer,
  onSelect,
}: TaskRowProps) {
  const isCompleted = task.status === 'completed';
  const overdue = isTaskOverdue(task);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  const priorityLabel =
    task.priority === 'urgent'
      ? t(lang, 'priorityUrgent')
      : task.priority === 'high'
      ? t(lang, 'priorityHigh')
      : task.priority === 'medium'
      ? t(lang, 'priorityMedium')
      : t(lang, 'priorityLow');

  const priorityTextColor =
    task.priority === 'urgent'
      ? 'text-[#E45D70]'
      : task.priority === 'high'
      ? 'text-[#F3AD55]'
      : task.priority === 'medium'
      ? 'text-[#6548F5] dark:text-[#8067FF]'
      : 'text-[#88889A] dark:text-[#9496A8]';

  const catColor = category?.color ?? '#6548F5';

  return (
    <div className="group flex items-center gap-2 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] px-3 py-2.5 hover:border-[#6548F5]/35 dark:hover:border-[#8067FF]/40 transition-colors">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        aria-label={isCompleted ? t(lang, 'reopenTaskBtn') : t(lang, 'markCompleteBtn')}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
      >
        <span
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-[#36B98A] border-[#36B98A] text-white'
              : 'border-[#D4D4E4] dark:border-[#3A3E54] group-hover:border-[#6548F5]'
          }`}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.75]" />}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onSelect(task)}
        className="flex-1 min-w-0 text-left py-1 cursor-pointer focus-visible:outline-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[15px] font-semibold truncate ${
              isCompleted
                ? 'line-through text-[#88889A] dark:text-[#7E8196]'
                : 'text-[#171725] dark:text-[#F4F4F8]'
            }`}
          >
            {task.title}
          </span>
        </div>

        {/* Unboxed metadata row using clean typographic separators */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-[#88889A] dark:text-[#9496A8]">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#171725]/80 dark:text-[#D5D6E2]">
            <span
              className="w-4 h-4 rounded-md inline-flex items-center justify-center text-white"
              style={{ backgroundColor: catColor }}
            >
              <CategoryIcon name={category?.icon ?? 'Layers'} className="w-2.5 h-2.5" />
            </span>
            {category?.name ?? t(lang, 'categoryLabel')}
          </span>

          {project && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[110px]">{project.name}</span>
            </>
          )}

          {task.dueAt && (
            <>
              <span aria-hidden="true">·</span>
              <span
                className={`inline-flex items-center gap-1 tabular-nums ${
                  overdue ? 'text-[#E45D70] font-semibold' : ''
                }`}
              >
                <Clock className="w-3 h-3" aria-hidden="true" />
                {formatDate(task.dueAt, lang, { month: 'short', day: 'numeric' })}{' '}
                {formatTime(task.dueAt, lang)}
              </span>
            </>
          )}

          <span aria-hidden="true">·</span>
          <span className={`inline-flex items-center gap-1 font-medium ${priorityTextColor}`}>
            <Flag className="w-3 h-3" aria-hidden="true" />
            {priorityLabel}
          </span>

          {task.subtasks.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {formatDigits(completedSubtasks, lang)}/{formatDigits(task.subtasks.length, lang)}
              </span>
            </>
          )}

          {task.repeatRule !== 'none' && (
            <>
              <span aria-hidden="true">·</span>
              <Repeat className="w-3 h-3 text-[#6548F5] dark:text-[#8067FF]" aria-label="Recurring" />
            </>
          )}
        </div>
      </button>

      {!isCompleted && !task.isArchived && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleTimer(task);
          }}
          aria-label={task.timerStartedAt ? t(lang, 'pauseTimerBtn') : t(lang, 'startTimerBtn')}
          className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center gap-1.5 px-2.5 text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            task.timerStartedAt
              ? 'bg-[#6548F5] text-white'
              : 'text-[#88889A] dark:text-[#9496A8] hover:bg-[#F8F8FC] dark:hover:bg-[#222534] hover:text-[#6548F5]'
          }`}
        >
          {task.timerStartedAt ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline tabular-nums">
                {formatDuration(
                  task.actualMinutes + Math.max(0, Math.floor((Date.now() - task.timerStartedAt) / 60000)),
                  lang
                )}
              </span>
            </>
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
