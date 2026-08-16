import { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft', className)}
      {...rest}
    />
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-leaf',
        className,
      )}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-leaf',
        className,
      )}
      {...rest}>
      {children}
    </select>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
