import { useCallback, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmRequest = Required<ConfirmOptions> & {
  resolve: (value: boolean) => void;
};

const defaultOptions: Required<ConfirmOptions> = {
  title: 'Confirm delete',
  message: 'Are you sure you want to delete this item?',
  confirmText: 'Delete',
  cancelText: 'Cancel',
};

export const useConfirm = () => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((options: ConfirmOptions = {}) => new Promise<boolean>((resolve) => {
    setRequest({ ...defaultOptions, ...options, resolve });
  }), []);

  const close = (value: boolean) => {
    request?.resolve(value);
    setRequest(null);
  };

  const ConfirmationDialog = () => {
    if (!request) return null;

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-red-100 bg-white shadow-2xl shadow-slate-950/25">
          <div className="flex items-start justify-between gap-4 border-b border-red-100 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-950">{request.title}</h3>
                <p className="mt-1 text-sm font-medium text-slate-600">{request.message}</p>
              </div>
            </div>
            <button onClick={() => close(false)} className="rounded-xl bg-white p-2 text-slate-500 ring-1 ring-red-100 hover:bg-red-50" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            <button onClick={() => close(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-black text-slate-700 hover:bg-slate-50">
              {request.cancelText}
            </button>
            <button onClick={() => close(true)} className="rounded-2xl bg-red-600 px-4 py-3 font-black text-white shadow-lg shadow-red-600/20 hover:bg-red-700">
              {request.confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmationDialog };
};
