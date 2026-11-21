import React, { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { Category, Project, categoryFormSchema, projectFormSchema } from '../types';
import { t } from '../localization/translations';
import {
  createCategory,
  createProject,
  deleteCategory,
  deleteProject,
  updateCategory,
  updateProject,
} from '../services/firebase/firestoreService';
import { formatDigits } from '../utils/formatters';
import { AVAILABLE_ICON_NAMES, CategoryIcon } from '../components/common/CategoryIcon';

const PALETTE = ['#6548F5', '#8067FF', '#36B98A', '#F3AD55', '#E45D70', '#3B82F6', '#10B981', '#EC4899'];

export function CategoriesProjectsScreen() {
  const { user } = useAuth();
  const { categories, projects, tasks, language } = useAppData();
  const [tab, setTab] = useState<'categories' | 'projects'>('categories');

  // Category Form State
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#6548F5');
  const [catIcon, setCatIcon] = useState('Briefcase');

  // Project Form State
  const [editingProj, setEditingProj] = useState<Project | null>(null);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projColor, setProjColor] = useState('#6548F5');
  const [projIcon, setProjIcon] = useState('FolderKanban');

  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg('');
    const parsed = categoryFormSchema.safeParse({ name: catName, color: catColor, icon: catIcon });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Invalid category');
      return;
    }
    if (editingCat) {
      await updateCategory(user.uid, editingCat.id, parsed.data);
      setEditingCat(null);
    } else {
      await createCategory(user.uid, parsed.data);
    }
    setCatName('');
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!user) return;
    setErrorMsg('');
    const usedCount = tasks.filter((tk) => tk.categoryId === cat.id).length;
    if (usedCount > 0) {
      setErrorMsg(t(language, 'cannotDeleteCategoryInUse'));
      return;
    }
    await deleteCategory(user.uid, cat.id);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg('');
    const parsed = projectFormSchema.safeParse({
      name: projName,
      description: projDesc,
      color: projColor,
      icon: projIcon,
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Invalid project');
      return;
    }
    if (editingProj) {
      await updateProject(user.uid, editingProj.id, parsed.data);
      setEditingProj(null);
    } else {
      await createProject(user.uid, parsed.data);
    }
    setProjName('');
    setProjDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8]">
          {t(language, 'navCategories')}
        </h1>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636]">
          <button
            type="button"
            onClick={() => {
              setTab('categories');
              setErrorMsg('');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              tab === 'categories'
                ? 'bg-[#6548F5] text-white'
                : 'text-[#88889A] hover:text-[#171725] dark:hover:text-white'
            }`}
          >
            {t(language, 'categoriesTab')}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('projects');
              setErrorMsg('');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              tab === 'projects'
                ? 'bg-[#6548F5] text-white'
                : 'text-[#88889A] hover:text-[#171725] dark:hover:text-white'
            }`}
          >
            {t(language, 'projectsTab')}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-2xl bg-[#E45D70]/10 border border-[#E45D70]/30 px-4 py-3 text-sm text-[#E45D70]">
          {errorMsg}
        </div>
      )}

      {tab === 'categories' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleSaveCategory}
            className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5 space-y-4"
          >
            <h2 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]">
              {editingCat ? t(language, 'renameCategory') : t(language, 'newCategory')}
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#88889A] mb-1.5">
                {t(language, 'categoryNameLabel')}
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                maxLength={48}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#88889A] mb-1.5">
                {t(language, 'colorLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setCatColor(hex)}
                    aria-label={hex}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${
                      catColor === hex ? 'ring-2 ring-offset-2 ring-[#6548F5] scale-110' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#88889A] mb-1.5">
                {t(language, 'iconLabel')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_ICON_NAMES.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setCatIcon(ic)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer border ${
                      catIcon === ic
                        ? 'bg-[#6548F5] text-white border-[#6548F5]'
                        : 'bg-[#F8F8FC] dark:bg-[#0D0E14] text-[#88889A] border-[#ECECF4] dark:border-[#242636]'
                    }`}
                  >
                    <CategoryIcon name={ic} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {editingCat && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCat(null);
                    setCatName('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#222534] text-xs font-semibold text-[#88889A] cursor-pointer"
                >
                  {t(language, 'cancelBtn')}
                </button>
              )}
              <button
                type="submit"
                className="flex-1 min-h-[44px] rounded-xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {editingCat ? t(language, 'updateTaskBtn') : t(language, 'newCategory')}
              </button>
            </div>
          </form>

          <div className="lg:col-span-7 space-y-2.5">
            {categories.map((cat) => {
              const count = tasks.filter((tk) => tk.categoryId === cat.id && !tk.isArchived).length;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#171725] dark:text-[#F4F4F8] truncate">
                        {cat.name}
                      </div>
                      <div className="text-xs text-[#88889A] tabular-nums">
                        {formatDigits(count, language)} {t(language, 'tasksCountLabel')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCat(cat);
                        setCatName(cat.name);
                        setCatColor(cat.color);
                        setCatIcon(cat.icon);
                      }}
                      aria-label={t(language, 'renameCategory')}
                      className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#88889A] hover:text-[#6548F5] cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!cat.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        aria-label={t(language, 'deleteBtn')}
                        className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#88889A] hover:text-[#E45D70] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleSaveProject}
            className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5 space-y-4"
          >
            <h2 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]">
              {editingProj ? t(language, 'editTaskTitle') : t(language, 'newProject')}
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#88889A] mb-1.5">
                {t(language, 'projectNameLabel')}
              </label>
              <input
                type="text"
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                maxLength={64}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#88889A] mb-1.5">
                {t(language, 'projectDescLabel')}
              </label>
              <textarea
                rows={2}
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                maxLength={300}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#88889A] mb-1.5">
                {t(language, 'colorLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setProjColor(hex)}
                    className={`w-8 h-8 rounded-full cursor-pointer ${
                      projColor === hex ? 'ring-2 ring-offset-2 ring-[#6548F5]' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {editingProj ? t(language, 'updateTaskBtn') : t(language, 'newProject')}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {projects.map((proj) => {
              const projTasks = tasks.filter((tk) => tk.projectId === proj.id && !tk.isArchived);
              const done = projTasks.filter((tk) => tk.status === 'completed').length;
              const pct = projTasks.length === 0 ? 0 : Math.round((done / projTasks.length) * 100);
              return (
                <div
                  key={proj.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: proj.color }}
                      >
                        <CategoryIcon name={proj.icon} className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#171725] dark:text-[#F4F4F8] truncate">
                          {proj.name}
                        </div>
                        {proj.description && (
                          <div className="text-xs text-[#88889A] truncate">{proj.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProj(proj);
                          setProjName(proj.name);
                          setProjDesc(proj.description);
                          setProjColor(proj.color);
                          setProjIcon(proj.icon);
                        }}
                        className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[#88889A] hover:text-[#6548F5] cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => user && deleteProject(user.uid, proj.id)}
                        className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[#88889A] hover:text-[#E45D70] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#88889A] mb-1.5 tabular-nums">
                      <span>
                        {formatDigits(done, language)}/{formatDigits(projTasks.length, language)}{' '}
                        {t(language, 'completedLabel')}
                      </span>
                      <span>{formatDigits(pct, language)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F8F8FC] dark:bg-[#242636] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: proj.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
