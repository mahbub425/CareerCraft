import { useEffect, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ToastType } from '../../lib/toast';

type ToastState = {
  message: string;
  type: ToastType;
};

const Toast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastState>).detail;
      setToast(detail);
      window.setTimeout(() => setToast(null), 3500);
    };

    window.addEventListener('app-toast', onToast);
    return () => window.removeEventListener('app-toast', onToast);
  }, []);

  if (!toast) return null;

  const Icon = toast.type === 'error' ? XCircle : toast.type === 'info' ? Info : CheckCircle2;
  const tone = toast.type === 'error'
    ? 'border-red-100 bg-red-50 text-red-700'
    : toast.type === 'info'
      ? 'border-blue-100 bg-blue-50 text-blue-700'
      : 'border-green-100 bg-green-50 text-green-700';

  return (
    <div className="fixed right-4 top-4 z-[100] w-[calc(100vw-2rem)] max-w-sm">
      <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-slate-900/15 ${tone}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm font-bold leading-relaxed">{toast.message}</p>
        <button onClick={() => setToast(null)} className="rounded-lg p-1 opacity-70 hover:bg-white/70 hover:opacity-100" aria-label="Close notification">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
