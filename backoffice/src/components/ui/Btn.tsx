'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  v?: Variant;
  loading?: boolean;
  ch?: ReactNode; // icon + label content, mirrors the reference Btn's `ch` prop
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-leaf text-white hover:bg-leaf/90 disabled:bg-leaf/50',
  secondary: 'bg-white text-register border border-ink/15 hover:bg-paper-dim disabled:opacity-50',
  danger: 'bg-alert text-white hover:bg-alert/90 disabled:bg-alert/50',
  ghost: 'bg-transparent text-ink-soft hover:bg-paper-dim disabled:opacity-50',
};

export function Btn({ v = 'primary', loading, ch, children, className, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        VARIANT_CLASS[v],
        className,
      )}>
      {loading ? <Loader2 size={15} className="animate-spin" /> : null}
      {ch ?? children}
    </button>
  );
}
