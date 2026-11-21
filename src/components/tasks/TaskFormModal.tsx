import React, { useEffect, useState } from 'react';
import { Paperclip, Plus, Trash2, X } from 'lucide-react';
import {
  Category,
  Language,
  Project,
  RepeatRule,
  Subtask,
  Task,
  TaskAttachment,
  taskFormSchema,
  TaskPriority,
  TaskStatus,
} from '../../types';
import { t, TranslationKey } from '../../localization/translations';
import { toDateTimeLocalInput } from '../../utils/formatters';
import { makeSafeId, TaskInputPayload } from '../../services/firebase/firestoreService';

interface TaskFormModalProps {
  open: boolean;
  lang: Language;
  categories: Category[];
  projects: Project[];
  initialTask?: Task | null;
  defaultDate?: Date | null;
  onClose: () => void;
  onSubmit: (payload: TaskInputPayload, existingTaskId?: string) => Promise<void>;
}

export function TaskFormModal({
  open,
  lang,
  categories,
  projects,
  initialTask,
  defaultDate,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('work');
  const [projectId, setProjectId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [startAt, setStartAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [repeatRule, setRepeatRule] = useState<RepeatRule>('none');
  const [tagsText, setTagsText] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setCategoryId(initialTask.categoryId || categories[0]?.id || 'work');
      setProjectId(initialTask.projectId ?? '');
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setStartAt(toDateTimeLocalInput(initialTask.startAt));
      setDueAt(toDateTimeLocalInput(initialTask.dueAt));
      setReminderAt(toDateTimeLocalInput(initialTask.reminderAt));
      setEstimatedMinutes(initialTask.estimatedMinutes);
      setRepeatRule(initialTask.repeatRule);
      setTagsText(initialTask.tags.join(', '));
      setSubtasks(initialTask.subtasks);
      setAttachments(initialTask.attachments);
    } else {
      const targetDue = defaultDate ? new Date(defaultDate) : new Date();
      targetDue.setHours(18, 0, 0, 0);
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || 'work');
      setProjectId('');
      setPriority('medium');
      setStatus('pending');
      setStartAt('');
      setDueAt(toDateTimeLocalInput(targetDue));
      setReminderAt('');
      setEstimatedMinutes(30);
      setRepeatRule('none');
      setTagsText('');
      setSubtasks([]);
      setAttachments([]);
    }
  }, [open, initialTask, defaultDate, categories]);

  if (!open) return null;

  const handleAddSubtask = () => {
    const clean = newSubtask.trim();
    if (!clean || subtasks.length >= 25) return;
    setSubtasks((prev) => [...prev, { id: makeSafeId('sub'), title: clean.slice(0, 120), completed: false }]);
    setNewSubtask('');
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || attachments.length >= 10) return;
    if (file.size > 350 * 1024) {
      setErrorMsg('Attachments are limited to 350 KB each.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      setAttachments((prev) => [
        ...prev,
        {
          id: makeSafeId('att'),
          name: file.name.slice(0, 80),
          type: file.type || 'application/octet-stream',
          size: file.size,
          url: result,
        },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const tags = tagsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);

    const parsed = taskFormSchema.safeParse({
      title,
      description,
      categoryId,
      projectId: projectId || null,
      priority,
      status,
      startAt: startAt || null,
      dueAt: dueAt || null,
      reminderAt: reminderAt || null,
      estimatedMinutes: Number(estimatedMinutes) || 0,
      repeatRule,
      tags,
      subtasks,
    });

    if (!parsed.success) {
      const firstKey = parsed.error.issues[0]?.message as TranslationKey;
      setErrorMsg(t(lang, firstKey) || parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(
        {
          title: parsed.data.title,
          description: parsed.data.description,
          categoryId: parsed.data.categoryId,
          projectId: parsed.data.projectId,
          priority: parsed.data.priority,
          status: parsed.data.status,
          startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
          dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
          reminderAt: parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : null,
          estimatedMinutes: parsed.data.estimatedMinutes,
          actualMinutes: initialTask?.actualMinutes ?? 0,
          subtasks: parsed.data.subtasks,
          tags: parsed.data.tags,
          attachments,
          repeatRule: parsed.data.repeatRule,
        },
        initialTask?.id
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-heading"
    >
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-[#161822]/95 backdrop-blur-md border-b border-[#ECECF4] dark:border-[#242636]">
          <h2 id="task-form-heading" className="text-lg font-bold text-[#171725] dark:text-[#F4F4F8]">
            {initialTask ? t(lang, 'editTaskTitle') : t(lang, 'createTaskTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, 'cancelBtn')}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#88889A] hover:bg-[#F8F8FC] dark:hover:bg-[#222534] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl bg-[#E45D70]/10 border border-[#E45D70]/30 px-4 py-3 text-sm text-[#E45D70]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
              {t(lang, 'taskTitleLabel')} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t(lang, 'taskTitlePlaceholder')}
              maxLength={140}
              className="w-full px-4 py-3 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
              {t(lang, 'descriptionLabel')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(lang, 'descriptionPlaceholder')}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(lang, 'categoryLabel')}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(lang, 'projectLabel')}
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              >
                <option value="">{t(lang, 'noProject')}</option>
                {projects
                  .filter((p) => !p.isArchived)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(lang, 'priorityLabel')}
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636]">
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      priority === p
                        ? 'bg-[#6548F5] text-white'
                        : 'text-[#88889A] dark:text-[#9496A8] hover:text-[#171725] dark:hover:text-white'
                    }`}
                  >
                    {p === 'low'
                      ? t(lang, 'priorityLow')
                      : p === 'medium'
                      ? t(lang, 'priorityMedium')
                      : p === 'high'
                      ? t(lang, 'priorityHigh')
                      : t(lang, 'priorityUrgent')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(lang, 'statusLabel')}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              >
                <option value="pending">{t(lang, 'statusPending')}</option>
                <option value="in_progress">{t(lang, 'statusInProgress')}</option>
                <option value="completed">{t(lang, 'statusCompleted')}</option>
                <option value="cancelled">{t(lang, 'statusCancelled')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(lang, 'startDateTime')}
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-xs text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(lang, 'dueDateTime')}
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-xs text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(lang, 'reminderDateTime')}
              </label>
              <input
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-xs text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(lang, 'estimatedDuration')}
              </label>
              <input
                type="number"
                min={0}
                max={14400}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm tabular-nums text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(lang, 'repeatRuleLabel')}
              </label>
              <select
                value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              >
                <option value="none">{t(lang, 'repeatNone')}</option>
                <option value="daily">{t(lang, 'repeatDaily')}</option>
                <option value="weekly">{t(lang, 'repeatWeekly')}</option>
                <option value="monthly">{t(lang, 'repeatMonthly')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
              {t(lang, 'tagsLabel')}
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="design, sprint, review"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
            />
          </div>

          {/* Subtasks builder */}
          <div>
            <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
              {t(lang, 'subtasksLabel')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder={t(lang, 'addSubtaskPlaceholder')}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="min-h-[42px] px-4 rounded-xl bg-[#6548F5]/10 text-[#6548F5] dark:text-[#8067FF] text-sm font-semibold hover:bg-[#6548F5]/18 transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                {t(lang, 'addSubtaskBtn')}
              </button>
            </div>
            {subtasks.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {subtasks.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] text-sm"
                  >
                    <span className="truncate text-[#171725] dark:text-[#F4F4F8]">{sub.title}</span>
                    <button
                      type="button"
                      onClick={() => setSubtasks((prev) => prev.filter((item) => item.id !== sub.id))}
                      aria-label="Remove subtask"
                      className="text-[#88889A] hover:text-[#E45D70] p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
              {t(lang, 'attachmentsLabel')}
            </label>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-dashed border-[#D4D4E4] dark:border-[#35384D] text-xs font-medium text-[#171725] dark:text-[#F4F4F8] hover:border-[#6548F5] cursor-pointer">
              <Paperclip className="w-4 h-4 text-[#6548F5]" />
              {t(lang, 'uploadAttachmentBtn')}
              <input
                type="file"
                accept="image/*,.pdf,.txt,.md"
                onChange={handleFileAttach}
                className="hidden"
              />
            </label>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] text-xs"
                  >
                    <span className="truncate text-[#171725] dark:text-[#F4F4F8]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                      className="text-[#88889A] hover:text-[#E45D70] p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECECF4] dark:border-[#242636]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#88889A] hover:bg-[#F8F8FC] dark:hover:bg-[#222534] cursor-pointer whitespace-nowrap"
            >
              {t(lang, 'cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {initialTask ? t(lang, 'updateTaskBtn') : t(lang, 'saveTaskBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
