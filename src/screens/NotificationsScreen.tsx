import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { t } from '../localization/translations';
import {
  clearAllNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '../services/firebase/firestoreService';
import { formatDateTime } from '../utils/formatters';

export function NotificationsScreen() {
  const { user } = useAuth();
  const {
    notifications,
    notificationPrefs,
    language,
    browserPermission,
    requestBrowserNotificationPermission,
  } = useAppData();

  const handleTogglePref = async (
    key: 'dueReminders' | 'upcomingAlerts' | 'overdueAlerts' | 'dailySummary' | 'morningBrief' | 'quietHoursEnabled'
  ) => {
    if (!user || !notificationPrefs) return;
    await updateNotificationPreferences(user.uid, {
      dueReminders: notificationPrefs.dueReminders,
      upcomingAlerts: notificationPrefs.upcomingAlerts,
      overdueAlerts: notificationPrefs.overdueAlerts,
      dailySummary: notificationPrefs.dailySummary,
      morningBrief: notificationPrefs.morningBrief,
      morningTime: notificationPrefs.morningTime,
      quietHoursEnabled: notificationPrefs.quietHoursEnabled,
      quietStart: notificationPrefs.quietStart,
      quietEnd: notificationPrefs.quietEnd,
      [key]: !notificationPrefs[key],
    });
  };

  const handleTimePref = async (
    key: 'morningTime' | 'quietStart' | 'quietEnd',
    value: string
  ) => {
    if (!user || !notificationPrefs) return;
    await updateNotificationPreferences(user.uid, {
      dueReminders: notificationPrefs.dueReminders,
      upcomingAlerts: notificationPrefs.upcomingAlerts,
      overdueAlerts: notificationPrefs.overdueAlerts,
      dailySummary: notificationPrefs.dailySummary,
      morningBrief: notificationPrefs.morningBrief,
      morningTime: notificationPrefs.morningTime,
      quietHoursEnabled: notificationPrefs.quietHoursEnabled,
      quietStart: notificationPrefs.quietStart,
      quietEnd: notificationPrefs.quietEnd,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8]">
          {t(language, 'notificationsTitle')}
        </h1>

        {browserPermission !== 'unsupported' && (
          <button
            type="button"
            disabled={browserPermission === 'granted'}
            onClick={requestBrowserNotificationPermission}
            className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer ${
              browserPermission === 'granted'
                ? 'bg-[#36B98A]/12 text-[#36B98A]'
                : browserPermission === 'denied'
                ? 'bg-[#E45D70]/12 text-[#E45D70]'
                : 'bg-[#6548F5] text-white hover:bg-[#5337DF]'
            }`}
          >
            <Bell className="w-4 h-4" />
            {browserPermission === 'granted'
              ? t(language, 'pushGranted')
              : browserPermission === 'denied'
              ? t(language, 'pushDenied')
              : t(language, 'enablePushBtn')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Notification Preferences */}
        <section className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5 space-y-4">
          <h2 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]">
            {t(language, 'navNotifications')}
          </h2>

          {notificationPrefs && (
            <div className="space-y-3">
              {(
                [
                  ['dueReminders', t(language, 'prefDueReminders')],
                  ['upcomingAlerts', t(language, 'prefUpcomingAlerts')],
                  ['overdueAlerts', t(language, 'prefOverdueAlerts')],
                  ['dailySummary', t(language, 'prefDailySummary')],
                  ['morningBrief', t(language, 'prefMorningBrief')],
                  ['quietHoursEnabled', t(language, 'prefQuietHours')],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 py-1.5"
                >
                  <span className="text-sm text-[#171725] dark:text-[#F4F4F8]">{label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationPrefs[key]}
                    onClick={() => handleTogglePref(key)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                      notificationPrefs[key]
                        ? 'bg-[#6548F5]'
                        : 'bg-[#D4D4E4] dark:bg-[#2F3347]'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        notificationPrefs[key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}

              {notificationPrefs.morningBrief && (
                <div className="flex items-center justify-between pt-2 border-t border-[#ECECF4] dark:border-[#242636]">
                  <span className="text-xs text-[#88889A]">{t(language, 'prefMorningTime')}</span>
                  <input
                    type="time"
                    value={notificationPrefs.morningTime}
                    onChange={(e) => handleTimePref('morningTime', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-xs text-[#171725] dark:text-[#F4F4F8]"
                  />
                </div>
              )}

              {notificationPrefs.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#ECECF4] dark:border-[#242636]">
                  <div>
                    <label className="block text-[11px] text-[#88889A] mb-1">
                      {t(language, 'prefQuietStart')}
                    </label>
                    <input
                      type="time"
                      value={notificationPrefs.quietStart}
                      onChange={(e) => handleTimePref('quietStart', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-xs text-[#171725] dark:text-[#F4F4F8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#88889A] mb-1">
                      {t(language, 'prefQuietEnd')}
                    </label>
                    <input
                      type="time"
                      value={notificationPrefs.quietEnd}
                      onChange={(e) => handleTimePref('quietEnd', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-xs text-[#171725] dark:text-[#F4F4F8]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Notification History */}
        <section className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]">
              {t(language, 'notificationsTitle')}
            </h2>
            {notifications.length > 0 && user && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead(user.uid, notifications)}
                  className="text-xs font-semibold text-[#6548F5] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {t(language, 'markAllRead')}
                </button>
                <button
                  type="button"
                  onClick={() => clearAllNotifications(user.uid, notifications)}
                  className="text-xs font-semibold text-[#E45D70] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t(language, 'clearAll')}
                </button>
              </div>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-[#88889A] dark:text-[#9496A8] py-10 text-center">
              {t(language, 'noNotifications')}
            </p>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => user && !item.isRead && markNotificationRead(user.uid, item.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer ${
                    item.isRead
                      ? 'bg-[#F8F8FC]/60 dark:bg-[#0D0E14]/50 border-[#ECECF4] dark:border-[#242636]'
                      : 'bg-[#6548F5]/6 dark:bg-[#6548F5]/12 border-[#6548F5]/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-sm text-[#171725] dark:text-[#F4F4F8]">
                      {item.title}
                    </div>
                    <span className="text-[11px] text-[#88889A] tabular-nums shrink-0">
                      {formatDateTime(item.createdAt, language)}
                    </span>
                  </div>
                  <p className="text-xs text-[#88889A] dark:text-[#9496A8] mt-1">{item.body}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
