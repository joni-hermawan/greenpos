import { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '@/lib/cn';

export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'alert';
}) {
  return (
    <Card className="flex items-center gap-3">
      {icon && (
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
            tone === 'alert' ? 'bg-alert/10 text-alert' : 'bg-leaf/10 text-leaf',
          )}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="mt-0.5 font-display text-xl font-bold text-ink">{value}</p>
      </div>
    </Card>
  );
}
