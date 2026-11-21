import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              destructive
                ? 'bg-[#E45D70]/12 text-[#E45D70]'
                : 'bg-[#6548F5]/12 text-[#6548F5]'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="confirm-modal-title"
              className="text-base font-bold text-[#171725] dark:text-[#F4F4F8]"
            >
              {title}
            </h3>
            <p className="text-sm text-[#88889A] dark:text-[#9496A8] mt-1 leading-relaxed">
              {body}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#171725] dark:text-[#F4F4F8] bg-[#F8F8FC] dark:bg-[#222534] hover:bg-[#ECECF4] dark:hover:bg-[#2B2F42] transition-colors cursor-pointer whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 ${
              destructive
                ? 'bg-[#E45D70] hover:bg-[#D1485C]'
                : 'bg-[#6548F5] hover:bg-[#5337DF]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
