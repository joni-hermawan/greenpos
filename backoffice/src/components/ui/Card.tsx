import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

// Matches GreenPos's card pattern (white bg, rounded-xl, hairline border,
// soft shadow) used throughout PosScreen/PembayaranScreen.
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-ink/10 bg-white p-5 shadow-sm', className)}
      {...rest}
    />
  );
}
