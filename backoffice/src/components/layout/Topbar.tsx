'use client';

import { useAuth } from '@/lib/AuthContext';
import { useMerchantScope } from '@/lib/MerchantScopeContext';

// Mirrors GreenPos/src/components/AppHeader.tsx's tablet layout: page
// title/subtitle on the left, merchant name (bold) above store name
// (softer) on the right. For superadmin (who has no merchant of their
// own) this shows whichever merchant is currently selected in the sidebar
// picker — "Semua Merchant" when browsing every merchant at once.
export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const { isSuperadmin, merchantName } = useMerchantScope();

  return (
    <header className="flex items-center justify-between border-b border-ink/10 bg-white px-8 py-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {user && (
        <div className="max-w-[280px] text-right">
          {isSuperadmin ? (
            merchantName && <p className="truncate text-sm font-bold text-ink">{merchantName}</p>
          ) : (
            <>
              {user.merchantName && <p className="truncate text-sm font-bold text-ink">{user.merchantName}</p>}
              {user.storeName && <p className="truncate text-xs font-medium text-ink-soft">{user.storeName}</p>}
            </>
          )}
        </div>
      )}
    </header>
  );
}
