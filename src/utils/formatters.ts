import { Language } from '../types';

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function formatDigits(value: string | number, lang: Language): string {
  const str = String(value);
  if (lang !== 'bn') return str;
  return str.replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)] ?? d);
}

export function formatDate(date: Date | null, lang: Language, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  return new Intl.DateTimeFormat(
    locale,
    options ?? { weekday: 'short', month: 'short', day: 'numeric' }
  ).format(date);
}

export function formatTime(date: Date | null, lang: Language): string {
  if (!date) return '';
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDateTime(date: Date | null, lang: Language): string {
  if (!date) return '';
  return `${formatDate(date, lang)} · ${formatTime(date, lang)}`;
}

export function formatDuration(minutes: number, lang: Language): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (lang === 'bn') {
    if (hrs > 0 && mins > 0) return `${formatDigits(hrs, 'bn')} ঘণ্টা ${formatDigits(mins, 'bn')} মি.`;
    if (hrs > 0) return `${formatDigits(hrs, 'bn')} ঘণ্টা`;
    return `${formatDigits(mins, 'bn')} মি.`;
  }
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toDateTimeLocalInput(date: Date | null): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
