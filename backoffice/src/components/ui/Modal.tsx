'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl`}
        onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink-soft/60 hover:text-ink-soft">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
