'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { effectivePages, PAGE_META } from '@/lib/constants';

// Root route is just a redirector: logged out -> /login, logged in ->
// the first page their menu permissions grant (or back to /login if
// somehow none — e.g. a brand-new account not yet given any page).
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const pages = effectivePages(user);
    router.replace(pages.length > 0 ? PAGE_META[pages[0]].href : '/login');
  }, [loading, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-paper">
      <Loader2 className="animate-spin text-leaf" size={28} />
    </div>
  );
}
