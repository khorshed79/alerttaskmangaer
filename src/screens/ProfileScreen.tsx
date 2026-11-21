import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
  Camera,
  ChevronRight,
  Download,
  FolderKanban,
  Globe,
  KeyRound,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { AppRoute, Language, ThemeMode } from '../types';
import { t } from '../localization/translations';
import { updateUserProfileFields } from '../services/firebase/firestoreService';
import { formatDigits } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { PWAInstallButton } from '../components/common/PWAInstallButton';

export function ProfileScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const { user, logout, changeUserPassword, deleteAccountCompletely } = useAuth();
  const { profile, tasks, categories, projects, language, setLanguage, theme, setTheme } = useAppData();

  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const activeTasks = tasks.filter((tk) => !tk.isArchived && tk.status !== 'cancelled');
  const completedCount = activeTasks.filter((tk) => tk.status === 'completed').length;
  const totalCount = activeTasks.length;

  const isEmailProvider = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        await updateUserProfileFields(user.uid, { photoURL: dataUrl });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;
    await updateUserProfileFields(user.uid, {
      displayName: displayName.trim(),
      bio: bio.trim(),
    });
    setEditingProfile(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    try {
      await changeUserPassword(newPassword);
      setNewPassword('');
      setShowPasswordBox(false);
      setStatusMsg(t(language, 'passwordUpdatedMsg'));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update password.');
    }
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      categories,
      projects,
      tasks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8]">
        {t(language, 'profileTitle')}
      </h1>

      {statusMsg && (
        <div className="rounded-2xl bg-[#36B98A]/12 border border-[#36B98A]/30 px-4 py-3 text-sm text-[#36B98A]">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl bg-[#E45D70]/12 border border-[#E45D70]/30 px-4 py-3 text-sm text-[#E45D70]">
          {errorMsg}
        </div>
      )}

      {/* Profile Header Card */}
      <section className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <img
                src={profile?.photoURL || '/src/assets/images/default_avatar_1795238348556.jpg'}
                alt={profile?.displayName ?? 'Profile'}
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-3xl object-cover border border-[#ECECF4] dark:border-[#242636]"
              />
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#6548F5] text-white flex items-center justify-center cursor-pointer shadow-md">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#171725] dark:text-[#F4F4F8] truncate">
                {profile?.displayName || user?.displayName || 'User'}
              </h2>
              <p className="text-xs text-[#88889A] dark:text-[#9496A8] truncate">
                {profile?.email || user?.email}
              </p>
              {profile?.bio && (
                <p className="text-xs text-[#171725]/80 dark:text-[#D5D6E2] mt-1">{profile.bio}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDisplayName(profile?.displayName ?? '');
              setBio(profile?.bio ?? '');
              setEditingProfile((prev) => !prev);
            }}
            className="min-h-[42px] px-4 rounded-xl bg-[#F8F8FC] dark:bg-[#222534] text-xs font-semibold text-[#6548F5] dark:text-[#8067FF] cursor-pointer self-start sm:self-center"
          >
            {t(language, 'editProfileBtn')}
          </button>
        </div>

        {editingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-5 pt-5 border-t border-[#ECECF4] dark:border-[#242636] space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t(language, 'fullName')}
              required
              maxLength={80}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8]"
            />
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t(language, 'bioPlaceholder')}
              maxLength={240}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#88889A] cursor-pointer"
              >
                {t(language, 'cancelBtn')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#6548F5] text-white text-xs font-semibold cursor-pointer"
              >
                {t(language, 'updateTaskBtn')}
              </button>
            </div>
          </form>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#ECECF4] dark:border-[#242636] text-center">
          <div>
            <div className="text-xl font-bold text-[#171725] dark:text-[#F4F4F8] tabular-nums">
              {formatDigits(totalCount, language)}
            </div>
            <div className="text-xs text-[#88889A]">{t(language, 'totalLabel')}</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#36B98A] tabular-nums">
              {formatDigits(completedCount, language)}
            </div>
            <div className="text-xs text-[#88889A]">{t(language, 'completedLabel')}</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#6548F5] tabular-nums">
              {formatDigits(
                totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
                language
              )}
              %
            </div>
            <div className="text-xs text-[#88889A]">{t(language, 'completionRate')}</div>
          </div>
        </div>
      </section>

      {/* Navigation & Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] divide-y divide-[#ECECF4] dark:divide-[#242636]">
          <button
            type="button"
            onClick={() => onNavigate('insights')}
            className="w-full min-h-[58px] px-5 flex items-center justify-between text-left hover:bg-[#F8F8FC] dark:hover:bg-[#1D2030] first:rounded-t-3xl cursor-pointer"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-[#171725] dark:text-[#F4F4F8]">
              <BarChart3 className="w-4 h-4 text-[#6548F5]" />
              {t(language, 'myStatistics')}
            </span>
            <ChevronRight className="w-4 h-4 text-[#88889A]" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('categories')}
            className="w-full min-h-[58px] px-5 flex items-center justify-between text-left hover:bg-[#F8F8FC] dark:hover:bg-[#1D2030] cursor-pointer"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-[#171725] dark:text-[#F4F4F8]">
              <FolderKanban className="w-4 h-4 text-[#36B98A]" />
              {t(language, 'navCategories')}
            </span>
            <ChevronRight className="w-4 h-4 text-[#88889A]" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            className="w-full min-h-[58px] px-5 flex items-center justify-between text-left hover:bg-[#F8F8FC] dark:hover:bg-[#1D2030] cursor-pointer"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-[#171725] dark:text-[#F4F4F8]">
              <Bell className="w-4 h-4 text-[#F3AD55]" />
              {t(language, 'notificationsTitle')}
            </span>
            <ChevronRight className="w-4 h-4 text-[#88889A]" />
          </button>

          <PWAInstallButton lang={language} variant="row" />
        </section>

        {/* Language & Appearance */}
        <section className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2.5 text-sm font-semibold text-[#171725] dark:text-[#F4F4F8]">
              <Globe className="w-4 h-4 text-[#6548F5]" />
              {t(language, 'languageLabel')}
            </span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14]">
              {(['en', 'bn'] as Language[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    language === l
                      ? 'bg-[#6548F5] text-white'
                      : 'text-[#88889A] hover:text-[#171725] dark:hover:text-white'
                  }`}
                >
                  {l === 'en' ? 'English' : 'বাংলা'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2.5 text-sm font-semibold text-[#171725] dark:text-[#F4F4F8]">
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-[#F3AD55]" />
              ) : (
                <Moon className="w-4 h-4 text-[#8067FF]" />
              )}
              {t(language, 'themeLabel')}
            </span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14]">
              {(['light', 'dark'] as ThemeMode[]).map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => setTheme(th)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    theme === th
                      ? 'bg-[#6548F5] text-white'
                      : 'text-[#88889A] hover:text-[#171725] dark:hover:text-white'
                  }`}
                >
                  {th === 'light' ? t(language, 'lightMode') : t(language, 'darkMode')}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Account Settings */}
      <section className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] divide-y divide-[#ECECF4] dark:divide-[#242636]">
        {isEmailProvider && (
          <div className="p-5">
            <button
              type="button"
              onClick={() => setShowPasswordBox((v) => !v)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-[#171725] dark:text-[#F4F4F8]">
                <KeyRound className="w-4 h-4 text-[#6548F5]" />
                {t(language, 'changePassword')}
              </span>
              <ChevronRight className="w-4 h-4 text-[#88889A]" />
            </button>
            {showPasswordBox && (
              <form onSubmit={handlePasswordChange} className="mt-3 flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t(language, 'newPasswordLabel')}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-xs text-[#171725] dark:text-[#F4F4F8]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#6548F5] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  {t(language, 'updatePasswordBtn')}
                </button>
              </form>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleExportData}
          className="w-full min-h-[56px] px-5 flex items-center justify-between text-left hover:bg-[#F8F8FC] dark:hover:bg-[#1D2030] cursor-pointer"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-[#171725] dark:text-[#F4F4F8]">
            <Download className="w-4 h-4 text-[#36B98A]" />
            {t(language, 'exportMyData')}
          </span>
          <ChevronRight className="w-4 h-4 text-[#88889A]" />
        </button>

        <button
          type="button"
          onClick={() => setShowPrivacyModal(true)}
          className="w-full min-h-[56px] px-5 flex items-center justify-between text-left hover:bg-[#F8F8FC] dark:hover:bg-[#1D2030] cursor-pointer"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-[#171725] dark:text-[#F4F4F8]">
            <Shield className="w-4 h-4 text-[#88889A]" />
            {t(language, 'privacyPolicy')}
          </span>
          <ChevronRight className="w-4 h-4 text-[#88889A]" />
        </button>

        <button
          type="button"
          onClick={() => setConfirmDeleteOpen(true)}
          className="w-full min-h-[56px] px-5 flex items-center justify-between text-left hover:bg-[#E45D70]/6 cursor-pointer"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-[#E45D70]">
            <Trash2 className="w-4 h-4" />
            {t(language, 'deleteAccount')}
          </span>
          <ChevronRight className="w-4 h-4 text-[#E45D70]" />
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full min-h-[56px] px-5 flex items-center justify-between text-left hover:bg-[#F8F8FC] dark:hover:bg-[#1D2030] last:rounded-b-3xl cursor-pointer"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-[#171725] dark:text-[#F4F4F8]">
            <LogOut className="w-4 h-4 text-[#88889A]" />
            {t(language, 'logoutBtn')}
          </span>
        </button>
      </section>

      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#171725] dark:text-[#F4F4F8]">
              {t(language, 'privacyPolicy')}
            </h3>
            <p className="text-sm text-[#88889A] dark:text-[#9496A8] leading-relaxed">
              Your tasks, categories, projects, and preferences are stored privately under your
              authenticated user path in Cloud Firestore and protected by strict user-isolation
              security rules. You may export or permanently delete your account data at any time.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#6548F5] text-white text-sm font-semibold cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDeleteOpen}
        title={t(language, 'confirmDeleteAccountTitle')}
        body={t(language, 'confirmDeleteAccountBody')}
        confirmLabel={t(language, 'deleteAccount')}
        cancelLabel={t(language, 'cancelBtn')}
        onConfirm={async () => {
          setConfirmDeleteOpen(false);
          try {
            await deleteAccountCompletely();
          } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Unable to delete account.');
          }
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
