'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Btn } from '@/components/ui/Btn';
import { Field, Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/AuthContext';
import { ALL_MERCHANTS, useMerchantScope } from '@/lib/MerchantScopeContext';
import { merchantApi } from '@/lib/api';

export default function MerchantSettingsPage() {
  const { showToast } = useToast();
  const { refresh } = useAuth();
  // superadmin has no merchant of their own — "my merchant" becomes
  // "whichever merchant is selected" via merchantApi.get(id) instead of
  // getMine(), same idea everywhere else for superadmin. This is a
  // single-merchant settings form, so "Semua Merchant" isn't a valid scope
  // here — the effect below skips loading in that case.
  const { merchantId, isSuperadmin } = useMerchantScope();
  const scopedToAll = merchantId === ALL_MERCHANTS;
  const [form, setForm] = useState({ name: '', address: '', logoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!merchantId || scopedToAll) return; // still loading, or "Semua Merchant" selected
    setLoading(true);
    const load = isSuperadmin ? merchantApi.get(merchantId) : merchantApi.getMine();
    load
      .then(m => setForm({ name: m.name, address: m.address, logoUrl: m.logoUrl ?? '' }))
      .finally(() => setLoading(false));
  }, [merchantId, isSuperadmin, scopedToAll]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isSuperadmin) await merchantApi.update(merchantId, form);
      else await merchantApi.updateMine(form);
      await refresh(); // sidebar/topbar merchant name should reflect the change immediately
      showToast({ type: 'success', message: 'Profil merchant disimpan' });
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menyimpan profil merchant', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Profil Merchant" subtitle="Nama dan alamat bisnis Anda — tampil di struk dan aplikasi kasir">
      <Card className="max-w-xl">
        {scopedToAll ? (
          <p className="py-4 text-center text-sm text-ink-soft">Pilih satu merchant tertentu di sidebar untuk mengatur profilnya.</p>
        ) : loading ? (
          <p className="py-4 text-center text-sm text-ink-soft">Memuat…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nama Merchant">
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Alamat">
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
            </Field>
            <ImageUpload label="Logo (opsional)" value={form.logoUrl} onChange={logoUrl => setForm({ ...form, logoUrl })} />
            <Btn type="submit" loading={saving} disabled={saving}>Simpan Perubahan</Btn>
          </form>
        )}
      </Card>
    </AppShell>
  );
}
