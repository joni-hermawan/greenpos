'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Btn } from '@/components/ui/Btn';
import { Field, Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { paymentConfigApi, storeApi } from '@/lib/api';
import { Store, StorePaymentConfig } from '@/lib/types';
import { ALL_MERCHANTS, useMerchantScope } from '@/lib/MerchantScopeContext';

const EMPTY: StorePaymentConfig = { storeId: '', qrisEnabled: false, midtransEnv: 'sandbox', midtransServerKey: '', midtransClientKey: '' };

export default function QrisSettingsPage() {
  const { showToast } = useToast();
  const { merchantId, apiMerchantId, isSuperadmin } = useMerchantScope();
  // Per-store settings form — "Semua Merchant" isn't a valid scope here,
  // since a store always belongs to exactly one merchant.
  const scopedToAll = merchantId === ALL_MERCHANTS;
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState('');
  const [form, setForm] = useState<StorePaymentConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!merchantId || scopedToAll) return; // still loading, or "Semua Merchant" selected
    storeApi.list(apiMerchantId).then(list => {
      setStores(list);
      if (list.length > 0) setStoreId(list[0].id);
      setLoading(false);
    });
  }, [merchantId, apiMerchantId, isSuperadmin, scopedToAll]);

  useEffect(() => {
    if (!storeId || scopedToAll) return;
    setLoading(true);
    paymentConfigApi.get(storeId, apiMerchantId).then(setForm).finally(() => setLoading(false));
  }, [storeId, apiMerchantId, scopedToAll]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await paymentConfigApi.update(storeId, form, apiMerchantId);
      setForm(updated);
      showToast({ type: 'success', message: 'Pengaturan QRIS disimpan', description: stores.find(s => s.id === storeId)?.name });
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menyimpan pengaturan QRIS', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Pengaturan QRIS" subtitle="Akun Midtrans per store — tiap store bisa punya akun sendiri">
      <Card className="max-w-xl">
        {scopedToAll ? (
          <p className="py-4 text-center text-sm text-ink-soft">Pilih satu merchant tertentu di sidebar untuk mengatur QRIS store-nya.</p>
        ) : (
          <>
        <Field label="Store">
          <Select value={storeId} onChange={e => setStoreId(e.target.value)}>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </Field>

        {loading ? (
          <p className="py-4 text-center text-sm text-ink-soft">Memuat…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.qrisEnabled} onChange={e => setForm({ ...form, qrisEnabled: e.target.checked })} />
              Aktifkan QRIS untuk store ini
            </label>

            {form.qrisEnabled && (
              <>
                <Field label="Environment">
                  <Select value={form.midtransEnv ?? 'sandbox'} onChange={e => setForm({ ...form, midtransEnv: e.target.value as StorePaymentConfig['midtransEnv'] })}>
                    <option value="sandbox">Sandbox</option>
                    <option value="production">Production</option>
                  </Select>
                </Field>
                <Field label="Midtrans Server Key">
                  <Input
                    value={form.midtransServerKey ?? ''}
                    onChange={e => setForm({ ...form, midtransServerKey: e.target.value })}
                    placeholder="SB-Mid-server-…"
                  />
                </Field>
                <Field label="Midtrans Client Key">
                  <Input
                    value={form.midtransClientKey ?? ''}
                    onChange={e => setForm({ ...form, midtransClientKey: e.target.value })}
                    placeholder="SB-Mid-client-…"
                  />
                </Field>
                <p className="text-xs text-ink-soft">
                  Dapatkan key dari dashboard.midtrans.com. Jika dikosongkan, store ini memakai simulator QRIS
                  (QR palsu, otomatis lunas ~3 detik) — aman untuk demo tanpa akun asli.
                </p>
              </>
            )}

            <Btn type="submit" loading={saving} disabled={saving}>Simpan Pengaturan</Btn>
          </form>
        )}
          </>
        )}
      </Card>
    </AppShell>
  );
}
