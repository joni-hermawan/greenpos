'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ShieldOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { effectivePages, PAGE_META, PageId } from '@/lib/constants';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

// Every protected page wraps its content in <AppShell>: redirects to
// /login when logged out, otherwise renders the sidebar + topbar shell
// around the page's own content (each page owns its title/subtitle so it
// can also drive document.title-style context without a route-group
// layout indirection).
//
// Also enforces menu permission client-side, not just via the sidebar
// hiding links: someone without a page granted (e.g. a bookmarked URL, or
// a menu that got revoked after they'd opened it) sees a clear "no access"
// message here instead of a page shell whose API calls silently 403/empty
// underneath. The backend is still the real boundary (see requirePermission
// in the Go server) — this is purely about not leaving a broken-looking
// page in front of someone who genuinely isn't allowed to be there.
function currentPageId(pathname: string): PageId | undefined {
  return (Object.keys(PAGE_META) as PageId[]).find(id => PAGE_META[id].href === pathname);
}

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-leaf" size={28} />
      </div>
    );
  }

  const pageId = currentPageId(pathname);
  const allowed = !pageId || effectivePages(user).includes(pageId);

  return (
    <div className="flex h-screen bg-paper">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Topbar title={title} subtitle={subtitle} />
        <main className="p-8">
          {allowed ? children : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-ink/10 bg-white px-6 py-16 text-center shadow-sm">
              <ShieldOff className="text-ink-soft" size={28} />
              <p className="font-medium text-ink">Anda tidak memiliki akses ke halaman ini.</p>
              <p className="max-w-sm text-sm text-ink-soft">
                Menu ini belum diaktifkan untuk akun Anda. Hubungi admin/superadmin jika Anda perlu akses ke halaman ini.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
