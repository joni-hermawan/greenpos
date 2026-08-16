'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ToastInput {
  type: 'success' | 'error';
  message: string;
  description?: string;
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastCtx = createContext<{ showToast: (t: ToastInput) => void }>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((t: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-lg min-w-[260px] max-w-sm',
              t.type === 'success' ? 'border-teal/30' : 'border-alert/30',
            )}>
            {t.type === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-teal" />
            ) : (
              <XCircle size={18} className="mt-0.5 flex-shrink-0 text-alert" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{t.message}</p>
              {t.description && <p className="mt-0.5 text-xs text-ink-soft">{t.description}</p>}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-ink-soft/50 hover:text-ink-soft">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
