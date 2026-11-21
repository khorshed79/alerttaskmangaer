import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  Mail,
  Moon,
  RefreshCw,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { Language, ThemeMode } from '../types';
import { t } from '../localization/translations';
import { updateUserProfileFields } from '../services/firebase/firestoreService';

export function SplashScreen() {
  const { language } = useAppData();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F8FC] dark:bg-[#0D0E14] px-6">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#6548F5] to-[#8067FF] flex items-center justify-center shadow-lg shadow-[#6548F5]/25 mb-5">
        <CheckCircle2 className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8]">
        {t(language, 'appName')}
      </h1>
      <p className="text-sm text-[#88889A] dark:text-[#9496A8] mt-1.5">
        {t(language, 'loadingWorkspace')}
      </p>
    </div>
  );
}

export function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const { language, setLanguage, theme, setTheme } = useAppData();
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: t(language, 'onboardingSlide1Title'),
      body: t(language, 'onboardingSlide1Body'),
      image: '/src/assets/images/onboarding_schedule_1795238348212.jpg',
    },
    {
      title: t(language, 'onboardingSlide2Title'),
      body: t(language, 'onboardingSlide2Body'),
      image: '/src/assets/images/onboarding_analytics_1795238347972.jpg',
    },
  ];

  const current = slides[step];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8F8FC] dark:bg-[#0D0E14] px-6 py-8">
      <div className="max-w-lg w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-xs font-semibold text-[#171725] dark:text-[#F4F4F8] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#6548F5]" />
            {language === 'en' ? 'বাংলা' : 'English'}
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] flex items-center justify-center text-[#171725] dark:text-[#F4F4F8] cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="min-h-[40px] px-3 text-sm font-semibold text-[#88889A] hover:text-[#6548F5] cursor-pointer"
        >
          {t(language, 'onboardingSkip')}
        </button>
      </div>

      <div className="max-w-lg w-full mx-auto my-auto py-8">
        <div className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] overflow-hidden p-5 sm:p-6">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#F8F8FC] dark:bg-[#0D0E14] mb-6">
            <img
              src={current.image}
              alt={current.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8] text-balance">
            {current.title}
          </h2>
          <p className="text-sm text-[#88889A] dark:text-[#9496A8] mt-3 leading-relaxed">
            {current.body}
          </p>
        </div>
      </div>

      <div className="max-w-lg w-full mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStep(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === step ? 'w-8 bg-[#6548F5]' : 'w-2 bg-[#D4D4E4] dark:bg-[#2F3347]'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            if (step < slides.length - 1) setStep(step + 1);
            else onFinish();
          }}
          className="min-h-[48px] px-6 rounded-2xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#6548F5]/20 whitespace-nowrap"
        >
          {step < slides.length - 1
            ? t(language, 'onboardingNext')
            : t(language, 'onboardingStart')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendResetEmail } = useAuth();
  const { language, setLanguage, theme, setTheme } = useAppData();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const mapAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not yet enabled in Firebase Console Authentication settings. Please use "Continue with Google" below or enable Email/Password provider in Firebase Console.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was closed before completion.';
    }
    return err instanceof Error ? err.message : 'Authentication failed.';
  };

  const handleGoogle = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'forgot') {
        await sendResetEmail(email);
        setInfoMsg(t(language, 'resetSentMsg'));
      } else if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name.');
          setBusy(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setBusy(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setBusy(false);
          return;
        }
        await signUpWithEmail(name, email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#F8F8FC] dark:bg-[#0D0E14] px-4 py-10">
      <div className="max-w-md w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6548F5] to-[#8067FF] flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-[#171725] dark:text-[#F4F4F8]">
              {t(language, 'appName')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] text-xs font-semibold text-[#171725] dark:text-[#F4F4F8] cursor-pointer"
            >
              {language === 'en' ? 'বাংলা' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label="Toggle theme"
              className="min-h-[40px] min-w-[40px] rounded-xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] flex items-center justify-center text-[#171725] dark:text-[#F4F4F8] cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-6 sm:p-8 shadow-xs">
          <h1 className="text-2xl font-bold text-[#171725] dark:text-[#F4F4F8]">
            {mode === 'login'
              ? t(language, 'signInTitle')
              : mode === 'signup'
              ? t(language, 'signUpTitle')
              : t(language, 'forgotTitle')}
          </h1>
          <p className="text-sm text-[#88889A] dark:text-[#9496A8] mt-1.5">
            {mode === 'login'
              ? t(language, 'signInSubtitle')
              : mode === 'signup'
              ? t(language, 'signUpSubtitle')
              : t(language, 'forgotSubtitle')}
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-[#E45D70]/10 border border-[#E45D70]/30 px-4 py-3 text-xs text-[#E45D70] leading-relaxed">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="mt-4 rounded-xl bg-[#36B98A]/10 border border-[#36B98A]/30 px-4 py-3 text-xs text-[#36B98A] leading-relaxed">
              {infoMsg}
            </div>
          )}

          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogle}
                className="mt-6 w-full min-h-[48px] px-4 rounded-2xl bg-[#171725] dark:bg-[#6548F5] hover:opacity-92 text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-opacity cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
                {t(language, 'continueWithGoogle')}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="h-px flex-1 bg-[#ECECF4] dark:bg-[#242636]" />
                <span className="text-xs text-[#88889A] dark:text-[#9496A8]">
                  {t(language, 'orWithEmail')}
                </span>
                <div className="h-px flex-1 bg-[#ECECF4] dark:bg-[#242636]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                  {t(language, 'fullName')}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#88889A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                {t(language, 'emailAddress')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#88889A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#88889A] dark:text-[#9496A8]">
                    {t(language, 'password')}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg('');
                        setInfoMsg('');
                      }}
                      className="text-xs font-semibold text-[#6548F5] hover:underline cursor-pointer"
                    >
                      {t(language, 'forgotPasswordLink')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#88889A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
                  {t(language, 'confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#88889A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[48px] rounded-2xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              {mode === 'login'
                ? t(language, 'signInBtn')
                : mode === 'signup'
                ? t(language, 'signUpBtn')
                : t(language, 'sendResetBtn')}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#88889A] dark:text-[#9496A8]">
            {mode === 'login' ? (
              <>
                {t(language, 'noAccountPrompt')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="font-semibold text-[#6548F5] hover:underline cursor-pointer"
                >
                  {t(language, 'createAccountLink')}
                </button>
              </>
            ) : (
              <>
                {mode === 'signup' ? `${t(language, 'haveAccountPrompt')} ` : ''}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="font-semibold text-[#6548F5] hover:underline cursor-pointer"
                >
                  {t(language, 'backToSignIn')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailVerificationScreen() {
  const { user, resendVerificationEmail, refreshAuthUser, logout } = useAuth();
  const { language } = useAppData();
  const [statusMsg, setStatusMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCheck = async () => {
    setBusy(true);
    setStatusMsg('');
    try {
      const verified = await refreshAuthUser();
      if (!verified) {
        setStatusMsg('Email is not verified yet. Please click the link sent to your inbox.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true);
    try {
      await resendVerificationEmail();
      setStatusMsg(t(language, 'verificationSentMsg'));
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Unable to send email right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC] dark:bg-[#0D0E14] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#6548F5]/12 text-[#6548F5] flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#171725] dark:text-[#F4F4F8]">
          {t(language, 'verifyTitle')}
        </h2>
        <p className="text-sm text-[#88889A] dark:text-[#9496A8] mt-2">
          {t(language, 'verifySubtitle')}
        </p>
        <p className="text-xs font-semibold text-[#171725] dark:text-[#F4F4F8] mt-2">
          {user?.email}
        </p>

        {statusMsg && (
          <p className="mt-4 text-xs text-[#6548F5] dark:text-[#8067FF] bg-[#6548F5]/10 rounded-xl p-3">
            {statusMsg}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleCheck}
            className="w-full min-h-[46px] rounded-2xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className="w-4 h-4" />
            {t(language, 'iveVerifiedBtn')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleResend}
            className="w-full min-h-[46px] rounded-2xl bg-[#F8F8FC] dark:bg-[#222534] text-[#171725] dark:text-[#F4F4F8] text-sm font-semibold cursor-pointer"
          >
            {t(language, 'resendVerification')}
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full py-2 text-xs font-semibold text-[#88889A] hover:text-[#E45D70] cursor-pointer"
          >
            {t(language, 'logoutBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileSetupScreen() {
  const { user } = useAuth();
  const { profile, language, setLanguage, theme, setTheme } = useAppData();
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || user?.email?.split('@')[0] || ''
  );
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      await updateUserProfileFields(user.uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        language,
        theme,
        onboarded: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC] dark:bg-[#0D0E14] px-4 py-10">
      <form
        onSubmit={handleSave}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-6 sm:p-8 space-y-5"
      >
        <div>
          <h2 className="text-xl font-bold text-[#171725] dark:text-[#F4F4F8]">
            {t(language, 'setupProfileTitle')}
          </h2>
          <p className="text-sm text-[#88889A] dark:text-[#9496A8] mt-1">
            {t(language, 'setupProfileSubtitle')}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
            {t(language, 'fullName')}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            required
            className="w-full px-4 py-3 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
            {t(language, 'bioLabel')}
          </label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t(language, 'bioPlaceholder')}
            maxLength={240}
            className="w-full px-4 py-3 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636] text-sm text-[#171725] dark:text-[#F4F4F8] focus:outline-none focus:border-[#6548F5]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
              {t(language, 'languageLabel')}
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636]">
              {(['en', 'bn'] as Language[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`py-2 rounded-lg text-xs font-semibold cursor-pointer ${
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

          <div>
            <label className="block text-xs font-semibold text-[#88889A] dark:text-[#9496A8] mb-1.5">
              {t(language, 'themeLabel')}
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F8F8FC] dark:bg-[#0D0E14] border border-[#ECECF4] dark:border-[#242636]">
              {(['light', 'dark'] as ThemeMode[]).map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => setTheme(th)}
                  className={`py-2 rounded-lg text-xs font-semibold cursor-pointer ${
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
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[48px] rounded-2xl bg-[#6548F5] hover:bg-[#5337DF] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
        >
          {t(language, 'saveAndContinue')}
        </button>
      </form>
    </div>
  );
}
