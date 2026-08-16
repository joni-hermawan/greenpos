'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building,
  Building2,
  CreditCard,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  Receipt,
  ScrollText,
  Store,
  Tag,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { ALL_MERCHANTS, useMerchantScope } from '@/lib/MerchantScopeContext';
import { effectivePages, PageId, PAGE_META, roleLabel } from '@/lib/constants';
import { Logo } from './Logo';
import { cn } from '@/lib/cn';

const ICONS: Record<PageId, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  produk: Package,
  promo: Tag,
  reporting: FileBarChart,
  riwayat: Receipt,
  stores: Store,
  users: Users,
  'pengaturan-merchant': Building2,
  'pengaturan-edc': CreditCard,
  'pengaturan-qris': QrCode,
  'superadmin-dashboard': Gauge,
  'superadmin-merchants': Building,
  'audit-trail': ScrollText,
};

function NavLink({ pageId, active }: { pageId: PageId; active: boolean }) {
  const meta = PAGE_META[pageId];
  const Icon = ICONS[pageId];
  return (
    <Link
      href={meta.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-paper/70 transition-colors hover:bg-register-light hover:text-paper',
        active && 'bg-register-light text-paper',
      )}>
      <Icon size={18} />
      {meta.title}
    </Link>
  );
}

// Visually mirrors GreenPos's App.tsx tablet sidebar (dark register-green
// background, rounded active nav item, user chip + Keluar pinned to the
// bottom) — same brand, not just the same color tokens. Every account gets
// the exact same layout and menu treatment; the only two things that ever
// differ are which items effectivePages(user) returns (per-user menu
// permission, see the Pengguna page) and, for superadmin, which merchant's
// data is loaded (the picker above) — never a separate visual section or badge.
export function Sidebar() {
  const { user, logout } = useAuth();
  const { isSuperadmin, merchants, merchantId, setMerchantId } = useMerchantScope();
  const pathname = usePathname();
  if (!user) return null;

  const pages = effectivePages(user);
  const initial = (user.name || '?').trim().charAt(0).toUpperCase();

  function isActive(pageId: PageId) {
    const href = PAGE_META[pageId].href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-register px-3 py-5">
      <div className="mb-4 px-2">
        <Logo size={36} variant="light" />
      </div>

      {isSuperadmin && (
        <div className="mb-4 px-2">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-paper/50">
            Merchant
          </label>
          <select
            value={merchantId}
            onChange={e => setMerchantId(e.target.value)}
            className="w-full rounded-lg border border-paper/20 bg-register-light px-2.5 py-2 text-xs font-medium text-paper outline-none">
            {merchants.length === 0 && <option value="">Memuat…</option>}
            {merchants.length > 0 && (
              <option value={ALL_MERCHANTS} className="text-ink">
                Semua Merchant
              </option>
            )}
            {merchants.map(m => (
              <option key={m.id} value={m.id} className="text-ink">
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {pages.map(pageId => (
          <NavLink key={pageId} pageId={pageId} active={isActive(pageId)} />
        ))}
      </nav>

      <div className="mt-4 border-t border-paper/15 pt-3">
        <div className="mb-2 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-leaf text-sm font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-paper">{user.name}</p>
            <p className="truncate text-xs capitalize text-paper/60">{roleLabel(user.role)}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-alert-light transition-colors hover:bg-register-light">
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
