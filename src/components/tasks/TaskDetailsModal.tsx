import { useEffect, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Bell,
  Calendar,
  Check,
  Clock,
  Copy,
  Edit3,
  FileText,
  Flag,
  Pause,
  Play,
  Plus,
  Repeat,
  Trash2,
  X,
} from 'lucide-react';
import { Category, Language, Project, Subtask, Task } from '../../types';
import { t } from '../../localization/translations';
import { formatDateTime, formatDigits, formatDuration } from '../../utils/formatters';
import { makeSafeId } from '../../services/firebase/firestoreService';
import { CategoryIcon } from '../common/CategoryIcon';
import { ConfirmModal } from '../common/ConfirmModal';

interface TaskDetailsModalProps {
  task: Task | null;
  category?: Category;
  project?: Project;
  lang: Language;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggleComplete: (task: Task) => Promise<void>;
  onToggleTimer: (task: Task) => Promise<void>;
  onUpdateSubtasks: (taskId: string, subtasks: Subtask[]) => Promise<void>;
  onDuplicate: (task: Task) => Promise<void>;
  onArchiveToggle: (task: Task) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskDetailsModal({
  task,
  category,
  project,
  lang,
  onClose,
  onEdit,
  onToggleComplete,
  onToggleTimer,
  onUpdateSubtasks,
  onDuplicate,
  onArchiveToggle,
  onDelete,
}: TaskDetailsModalProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!task?.timerStartedAt) {
      setElapsedSec(0);
      return;
    }
    const tick = () => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - (task.timerStartedAt ?? Date.now())) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [task?.timerStartedAt]);

  if (!task) return null;

  const isCompleted = task.status === 'completed';
  const completedSubCount = task.subtasks.filter((s) => s.completed).length;

  const handleToggleSub = async (subId: string) => {
    const updated = task.subtasks.map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    await onUpdateSubtasks(task.id, updated);
  };

  const handleAddSub = async () => {
    const clean = newSubtaskTitle.trim();
    if (!clean || task.subtasks.length >= 25) return;
    const updated = [
      ...task.subtasks,
      { id: makeSafeId('sub'), title: clean.slice(0, 120), completed: false },
    ];
    setNewSubtaskTitle('');
    await onUpdateSubtasks(task.id, updated);
  };

  const handleRemoveSub = async (subId: string) => {
    const updated = task.subtasks.filter((s) => s.id !== subId);
    await onUpdateSubtasks(task.id, updated);
  };

  const formatTimerClock = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const priorityLabel =
    task.priority === 'urgent'
      ? t(lang, 'priorityUrgent')
      : task.priority === 'high'
      ? t(lang, 'priorityHigh')
      : task.priority === 'medium'
      ? t(lang, 'priorityMedium')
      : t(lang, 'priorityLow');

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-heading"
      >
        <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-[#161822]/95 backdrop-blur-md border-b border-[#ECECF4] dark:border-[#242636]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: category?.color ?? '#6548F5' }}
              >
                <CategoryIcon name={category?.icon ?? 'Layers'} className="w-4 h-4" />
              </span>
              <span className="text-sm font-semibold text-[#171725] dark:text-[#F4F4F8] truncate">
                {category?.name ?? t(lang, 'categoryLabel')}
                {project ? ` · ${project.name}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={t(lang, 'editTaskTitle')}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#6548F5] hover:bg-[#6548F5]/10 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label={t(lang, 'cancelBtn')}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#88889A] hover:bg-[#F8F8FC] dark:hover:bg-[#222534] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2
                id="task-details-heading"
                className={`text-xl font-bold leading-snug ${
                  isCompleted
                    ? 'line-through text-[#88889A]'
                    : 'text-[#171725] dark:text-[#F4F4F8]'
                }`}
              >
                {task.title}
              </h2>
              {task.description && (
                <p className="mt-2.5 text-sm text-[#88889A] dark:text-[#9496A8] whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              )}
              {task.tags.length > 0 && (
                <p className="mt-2 text-xs text-[#88889A] dark:text-[#9496A8]">
                  {task.tags.map((tag) => `#${tag}`).join(' · ')}
                </p>
              )}
            </div>

            {/* Key Attributes Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 rounded-2xl bg-[#F8F8FC] dark:bg-[#0D0E14]">
                <div className="text-xs text-[#88889A] dark:text-[#9496A8] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {t(lang, 'dueDateTime')}
                </div>
                <div className="mt-1 font-semibold text-[#171725] dark:text-[#F4F4F8] tabular-nums">
                  {task.dueAt ? formatDateTime(task.dueAt, lang) : '—'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8F8FC] dark:bg-[#0D0E14]">
                <div className="text-xs text-[#88889A] dark:text-[#9496A8] flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  {t(lang, 'priorityLabel')}
                </div>
                <div className="mt-1 font-semibold text-[#171725] dark:text-[#F4F4F8]">
                  {priorityLabel}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8F8FC] dark:bg-[#0D0E14]">
                <div className="text-xs text-[#88889A] dark:text-[#9496A8] flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  {t(lang, 'reminderDateTime')}
                </div>
                <div className="mt-1 font-semibold text-[#171725] dark:text-[#F4F4F8] tabular-nums">
                  {task.reminderAt ? formatDateTime(task.reminderAt, lang) : '—'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8F8FC] dark:bg-[#0D0E14]">
                <div className="text-xs text-[#88889A] dark:text-[#9496A8] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {t(lang, 'actualDuration')}
                </div>
                <div className="mt-1 font-semibold text-[#171725] dark:text-[#F4F4F8] tabular-nums">
                  {formatDuration(task.actualMinutes, lang)} / {formatDuration(task.estimatedMinutes, lang)}
                </div>
              </div>
            </div>

            {task.repeatRule !== 'none' && (
              <div className="flex items-center gap-2 text-xs font-medium text-[#6548F5] dark:text-[#8067FF]">
                <Repeat className="w-4 h-4" />
                <span>
                  {t(lang, 'repeatRuleLabel')}:{' '}
                  {task.repeatRule === 'daily'
                    ? t(lang, 'repeatDaily')
                    : task.repeatRule === 'weekly'
                    ? t(lang, 'repeatWeekly')
                    : t(lang, 'repeatMonthly')}
                </span>
              </div>
            )}

            {/* Live Focus Timer */}
            {!task.isArchived && (
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#6548F5]/8 dark:bg-[#6548F5]/15">
                <div>
                  <div className="text-xs font-semibold text-[#6548F5] dark:text-[#8067FF]">
                    {t(lang, 'actualDuration')}
                  </div>
                  <div className="text-xl font-bold text-[#171725] dark:text-[#F4F4F8] font-mono tabular-nums mt-0.5">
                    {task.timerStartedAt
                      ? formatTimerClock(elapsedSec)
                      : formatDuration(task.actualMinutes, lang)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleTimer(task)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
                >
                  {task.timerStartedAt ? (
                    <>
                      <Pause className="w-4 h-4" />
                      {t(lang, 'pauseTimerBtn')}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      {t(lang, 'startTimerBtn')}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Subtasks Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-bold text-[#171725] dark:text-[#F4F4F8]">
                  {t(lang, 'subtasksLabel')}
                </h3>
                {task.subtasks.length > 0 && (
                  <span className="text-xs text-[#88889A] tabular-nums">
                    {formatDigits(completedSubCount, lang)}/{formatDigits(task.subtasks.length, lang)}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14]"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSub(sub.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          sub.completed
                            ? 'bg-[#36B98A] border-[#36B98A] text-white'
                            : 'border-[#D4D4E4] dark:border-[#3A3E54]'
                        }`}
                      >
                        {sub.completed && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span
                        className={`text-sm truncate ${
                          sub.completed
                            ? 'line-through text-[#88889A]'
                            : 'text-[#171725] dark:text-[#F4F4F8]'
                        }`}
                      >
                        {sub.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSub(sub.id)}
                      aria-label="Remove subtask"
                      className="p-1.5 text-[#88889A] hover:text-[#E45D70] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2.5">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSub();
                    }
                  }}
                  placeholder={t(lang, 'addSubtaskPlaceholder')}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
                />
                <button
                  type="button"
                  onClick={handleAddSub}
                  className="min-h-[42px] px-3.5 rounded-xl bg-[#F8F8FC] dark:bg-[#222534] text-sm font-semibold text-[#6548F5] dark:text-[#8067FF] hover:bg-[#ECECF4] cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t(lang, 'addSubtaskBtn')}
                </button>
              </div>
            </div>

            {/* Attachments */}
            {task.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#171725] dark:text-[#F4F4F8] mb-2.5">
                  {t(lang, 'attachmentsLabel')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {task.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      download={att.name}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] hover:border-[#6548F5]"
                    >
                      {att.type.startsWith('image/') ? (
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#6548F5]/10 text-[#6548F5] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-[#171725] dark:text-[#F4F4F8] truncate">
                        {att.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#ECECF4] dark:border-[#242636] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onDuplicate(task);
                    onClose();
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#222534] text-xs font-semibold text-[#171725] dark:text-[#F4F4F8] hover:bg-[#ECECF4] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {t(lang, 'duplicateBtn')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onArchiveToggle(task);
                    onClose();
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#222534] text-xs font-semibold text-[#171725] dark:text-[#F4F4F8] hover:bg-[#ECECF4] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {task.isArchived ? (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      {t(lang, 'restoreBtn')}
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      {t(lang, 'archiveBtn')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#E45D70]/10 text-xs font-semibold text-[#E45D70] hover:bg-[#E45D70]/18 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t(lang, 'deleteBtn')}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onToggleComplete(task)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap ${
                  isCompleted
                    ? 'bg-[#88889A] hover:bg-[#6E6E80]'
                    : 'bg-[#36B98A] hover:bg-[#2CA378]'
                }`}
              >
                {isCompleted ? t(lang, 'reopenTaskBtn') : t(lang, 'markCompleteBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={t(lang, 'confirmDeleteTaskTitle')}
        body={t(lang, 'confirmDeleteTaskBody')}
        confirmLabel={t(lang, 'deleteBtn')}
        cancelLabel={t(lang, 'cancelBtn')}
        onConfirm={async () => {
          await onDelete(task.id);
          setConfirmOpen(false);
          onClose();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
