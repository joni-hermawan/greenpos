'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Receipt, CreditCard, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { DEMO_ACCOUNTS } from '@/lib/api';
import { Logo } from '@/components/layout/Logo';
import { Btn } from '@/components/ui/Btn';
import { Input, Label } from '@/components/ui/Input';
import { effectivePages, PAGE_META } from '@/lib/constants';

const FEATURES = [
  { icon: Receipt, text: 'Kelola produk, promo, dan stok dalam satu tempat' },
  { icon: CreditCard, text: 'Atur integrasi EDC & QRIS per store' },
  { icon: BarChart3, text: 'Pantau laporan penjualan real-time' },
];

// Same split-panel design as GreenPos/src/screens/LoginScreen.tsx's tablet
// layout (brand panel + feature list on the left, form card on the right,
// quick-fill demo account cards) — web is always "wide" so this layout
// always applies, no phone-vs-tablet branch needed.
export default function LoginPage() {
  const { user, login, loginError, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const pages = effectivePages(user);
      router.replace(pages.length > 0 ? PAGE_META[pages[0]].href : '/login');
    }
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  }

  function fillDemo(acc: (typeof DEMO_ACCOUNTS)[number]) {
    setUsername(acc.username);
    setPassword(acc.password);
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-register px-16 md:flex">
        <Image
          src="/logo-mark.png"
          alt=""
          width={480}
          height={480}
          className="pointer-events-none absolute -bottom-24 -right-24 opacity-[0.06]"
        />
        <Logo size={44} variant="light" />
        <p className="mt-6 text-xs font-semibold tracking-[0.25em] text-leaf-light">
          BACK-OFFICE · SMART · FLEXIBLE
        </p>
        <div className="mt-10 space-y-5">
          {FEATURES.map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <f.icon size={18} className="text-leaf-light" />
              <p className="text-sm font-medium text-paper/90">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-paper px-6 py-12 md:w-1/2">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-2 md:hidden">
            <Logo size={36} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Masuk</h1>
          <p className="mt-1 text-sm text-ink-soft">Kelola merchant, store, dan pengaturan pembayaran Anda.</p>

          {loginError && (
            <div className="mt-4 rounded-lg bg-alert/10 px-3 py-2.5 text-sm text-alert">{loginError}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin01" autoCapitalize="none" autoCorrect="off" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Btn type="submit" className="w-full" loading={submitting} disabled={submitting}>
              Masuk
            </Btn>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-leaf/40 bg-leaf/5 p-3">
            <p className="mb-2 text-xs font-semibold text-ink">Mode Demo — klik salah satu untuk isi otomatis:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="rounded-lg border border-leaf/30 bg-white px-2.5 py-1.5 text-left hover:bg-leaf/5">
                  <p className="text-xs font-semibold text-ink">{acc.label}</p>
                  <p className="text-[11px] text-ink-soft">{acc.username}</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-soft">kasir tidak memiliki akses ke back-office ini.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
