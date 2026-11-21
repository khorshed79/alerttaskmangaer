import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    let displayMessage = this.state.message;
    try {
      const parsed = JSON.parse(this.state.message);
      if (parsed && parsed.error) {
        displayMessage = `${parsed.error}${parsed.path ? ` (${parsed.path})` : ''}`;
      }
    } catch {
      // Plain error string
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8FC] dark:bg-[#0D0E14] p-6">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636] p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#E45D70]/10 text-[#E45D70] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#171725] dark:text-[#F4F4F8] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[#88889A] dark:text-[#9496A8] mb-6 break-words">
            {displayMessage}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6548F5] text-white text-sm font-medium hover:bg-[#5438E0] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
