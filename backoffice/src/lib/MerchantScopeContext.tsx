'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { merchantApi } from './api';
import { Merchant } from './types';

// Sentinel merchantId value meaning "every merchant" — only ever set for
// superadmin. Every merchant-scoped API call translates this to `undefined`
// (see `apiMerchantId` below) so the backend's own "no merchantId = every
// merchant" handling kicks in.
export const ALL_MERCHANTS = 'all';

interface MerchantScopeCtx {
  // The merchant id to show in the picker / use for guards. '' while
  // auth/merchant-list is still loading, ALL_MERCHANTS, or a real id.
  merchantId: string;
  // Same value, translated for API calls: ALL_MERCHANTS (and '') become
  // undefined, which every API function treats as "omit the query param".
  apiMerchantId: string | undefined;
  merchantName: string;
  isSuperadmin: boolean;
  merchants: Merchant[]; // populated for superadmin only, for the picker
  setMerchantId: (id: string) => void;
  // Resolves any merchantId (e.g. from a row in an "all merchants" table)
  // to its display name — falls back to the id itself if not loaded yet.
  merchantNameById: (id?: string) => string;
}

const Ctx = createContext<MerchantScopeCtx>({
  merchantId: '',
  apiMerchantId: undefined,
  merchantName: '',
  isSuperadmin: false,
  merchants: [],
  setMerchantId: () => {},
  merchantNameById: () => '-',
});

const STORAGE_KEY = 'greenpos_active_merchant';

// Wraps every protected page — lets a superadmin pick which merchant to
// look at (dashboard, produk, promo, reporting, riwayat, stores, users,
// pengaturan all scope to this pick) without giving them a merchant of
// their own. Defaults to ALL_MERCHANTS ("every merchant at once") unless
// they've previously picked one specific merchant, persisted to
// localStorage so the selection survives a refresh.
export function MerchantScopeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (!isSuperadmin) return;
    merchantApi.list().then(list => {
      setMerchants(list);
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      const initial = stored && (stored === ALL_MERCHANTS || list.some(m => m.id === stored)) ? stored : ALL_MERCHANTS;
      setSelected(initial);
    });
  }, [isSuperadmin]);

  const setMerchantId = useCallback((id: string) => {
    setSelected(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const merchantNameById = useCallback(
    (id?: string) => {
      if (!id) return '-';
      return merchants.find(m => m.id === id)?.name ?? id;
    },
    [merchants],
  );

  const merchantId = isSuperadmin ? selected : user?.merchantId ?? '';
  const apiMerchantId = merchantId === ALL_MERCHANTS || merchantId === '' ? undefined : merchantId;
  const merchantName = isSuperadmin
    ? (selected === ALL_MERCHANTS ? 'Semua Merchant' : merchants.find(m => m.id === selected)?.name ?? '')
    : user?.merchantName ?? '';

  const value = useMemo(
    () => ({ merchantId, apiMerchantId, merchantName, isSuperadmin, merchants, setMerchantId, merchantNameById }),
    [merchantId, apiMerchantId, merchantName, isSuperadmin, merchants, setMerchantId, merchantNameById],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMerchantScope() {
  return useContext(Ctx);
}
