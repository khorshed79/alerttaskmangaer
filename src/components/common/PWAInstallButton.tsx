import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Language } from '../../types';

export function PWAInstallButton({
  lang,
  variant = 'compact',
}: {
  lang: Language;
  variant?: 'compact' | 'row';
}) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const label = lang === 'bn' ? 'অ্যান্ড্রয়েড/ফোনে ইনস্টল করুন' : 'Install App';

  if (isInstallable) {
    if (variant === 'row') {
      return (
        <button
          type="button"
          onClick={install}
          className="w-full min-h-[56px] px-5 flex items-center justify-between text-left hover:bg-[#F8F8FC] dark:hover:bg-[#1D2030] cursor-pointer"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-[#6548F5] dark:text-[#8067FF]">
            <Smartphone className="w-4 h-4" />
            {label}
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[40px] px-3.5 rounded-xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
      >
        <Smartphone className="w-3.5 h-3.5" />
        {label}
      </button>
    );
  }

  if (isIOS || variant === 'row') {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className={
            variant === 'row'
              ? 'w-full min-h-[56px] px-5 flex items-center justify-between text-left hover:bg-[#F8F8FC] dark:hover:bg-[#1D2030] cursor-pointer'
              : 'min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-xs font-semibold text-[#171725] dark:text-[#F4F4F8] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap'
          }
        >
          <span className="flex items-center gap-3">
            <Smartphone className="w-4 h-4 text-[#6548F5]" />
            {label}
          </span>
        </button>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-6 space-y-3">
              <h3 className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]">
                {lang === 'bn' ? 'মোবাইলে অ্যাপ ইনস্টল করুন' : 'Install TaskFlow on Mobile'}
              </h3>
              <p className="text-xs text-[#88889A] dark:text-[#9496A8] leading-relaxed">
                {isIOS
                  ? lang === 'bn'
                    ? 'Safari ব্রাউজারের Share আইকনে ট্যাপ করে "Add to Home Screen" সিলেক্ট করুন।'
                    : 'Tap the Share button in Safari and select "Add to Home Screen".'
                  : lang === 'bn'
                  ? 'Android Chrome ব্রাউজারে Shared App URL খুলে মেনু (⋮) থেকে "Install app" বা "Add to Home screen" ট্যাপ করুন।'
                  : 'Open the app URL in Android Chrome, tap the browser menu (⋮), and select "Install app" or "Add to Home screen".'}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="px-4 py-2 rounded-xl bg-[#6548F5] text-white text-xs font-semibold cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
