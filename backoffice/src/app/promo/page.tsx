'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Btn } from '@/components/ui/Btn';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { productApi, promoApi, storeApi } from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Promo, PromoType, Store } from '@/lib/types';
import { ALL_MERCHANTS, useMerchantScope } from '@/lib/MerchantScopeContext';

const EMPTY_FORM = { name: '', description: '', type: 'percentage' as PromoType, value: '', minPurchase: '', categories: [] as string[], storeIds: [] as string[], active: true };

export default function PromoPage() {
  const { showToast } = useToast();
  const { merchantId, apiMerchantId, isSuperadmin, merchants, merchantNameById } = useMerchantScope();
  const showMerchantColumn = merchantId === ALL_MERCHANTS;
  const [promos, setPromos] = useState<Promo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createMerchantId, setCreateMerchantId] = useState('');

  function load() {
    if (!merchantId) return; // still waiting for auth/merchant-scope to resolve
    setLoading(true);
    Promise.all([promoApi.list(apiMerchantId), productApi.list(apiMerchantId), storeApi.list(apiMerchantId)])
      .then(([p, prod, st]) => {
        setPromos(p);
        setCategories(Array.from(new Set(prod.map(x => x.category))));
        setStores(st);
      })
      .finally(() => setLoading(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [merchantId, isSuperadmin]);

  const storeName = (id: string) => stores.find(s => s.id === id)?.name ?? id;

  // Which merchant the create/edit form's store checkboxes are scoped to —
  // same cascade as the Pengguna page's data filter: pick a merchant
  // first, only then can specific stores be chosen.
  const formMerchantId = editing ? editing.merchantId : (showMerchantColumn ? createMerchantId : apiMerchantId);
  const scopedStores = stores.filter(s => s.merchantId === formMerchantId);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCreateMerchantId(showMerchantColumn ? '' : apiMerchantId ?? '');
    setModalOpen(true);
  }

  function openEdit(p: Promo) {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, type: p.type,
      value: String(p.value), minPurchase: String(p.minPurchase),
      categories: p.categories ?? [], storeIds: p.storeIds ?? [], active: p.active,
    });
    setModalOpen(true);
  }

  function toggleCategory(cat: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat],
    }));
  }

  function toggleStore(storeId: string) {
    setForm(f => ({
      ...f,
      storeIds: f.storeIds.includes(storeId) ? f.storeIds.filter(s => s !== storeId) : [...f.storeIds, storeId],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = {
      name: form.name, description: form.description, type: form.type,
      value: Number(form.value) || 0, minPurchase: Number(form.minPurchase) || 0,
      categories: form.categories.length > 0 ? form.categories : undefined,
      storeIds: form.storeIds,
      active: form.active,
    };
    try {
      if (editing) await promoApi.update(editing.id, input, formMerchantId);
      else await promoApi.create(input, formMerchantId);
      showToast({ type: 'success', message: editing ? 'Promo diperbarui' : 'Promo ditambahkan' });
      setModalOpen(false);
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menyimpan promo', description: err instanceof Error ? err.message : undefined });
    }
  }

  async function toggleActive(p: Promo) {
    try {
      await promoApi.update(p.id, {
        name: p.name, description: p.description, type: p.type,
        value: p.value, minPurchase: p.minPurchase, categories: p.categories, active: !p.active,
      }, p.merchantId);
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal mengubah status promo', description: err instanceof Error ? err.message : undefined });
    }
  }

  async function handleDelete(p: Promo) {
    if (!confirm(`Hapus promo "${p.name}"?`)) return;
    try {
      await promoApi.delete(p.id, p.merchantId);
      showToast({ type: 'success', message: 'Promo dihapus' });
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menghapus promo', description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <AppShell title="Promo" subtitle="Diskon otomatis diterapkan ke keranjang yang paling menguntungkan pelanggan">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">{promos.length} promo</p>
          <Btn onClick={openCreate} ch={<><Plus size={15} /> Tambah Promo</>} />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-soft">Memuat…</p>
        ) : promos.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">Belum ada promo. Kasir hanya akan menerapkan harga normal.</p>
        ) : (
          <div className="space-y-3">
            {promos.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4 transition-colors hover:bg-paper-dim/40">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{p.name}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', p.active ? 'bg-teal/10 text-teal' : 'bg-ink/10 text-ink-soft')}>
                      {p.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {showMerchantColumn && (
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink-soft">
                        {merchantNameById(p.merchantId)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">{p.description}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {p.type === 'percentage' ? `${p.value}%` : formatRupiah(p.value)} · min. belanja {formatRupiah(p.minPurchase)}
                    {p.categories && p.categories.length > 0 && ` · kategori: ${p.categories.join(', ')}`}
                    {` · `}{!p.storeIds || p.storeIds.length === 0 ? 'semua store' : p.storeIds.map(storeName).join(', ')}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => toggleActive(p)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-dim">
                    {p.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button onClick={() => openEdit(p)} className="rounded-md p-1.5 text-ink-soft hover:bg-paper-dim hover:text-ink">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(p)} className="rounded-md p-1.5 text-ink-soft hover:bg-alert/10 hover:text-alert">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Promo' : 'Tambah Promo'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editing && showMerchantColumn && (
            <Field label="Merchant">
              <Select
                value={createMerchantId}
                onChange={e => { setCreateMerchantId(e.target.value); setForm(f => ({ ...f, storeIds: [] })); }}
                required>
                <option value="" disabled>Pilih merchant…</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-ink-soft">Menentukan store mana saja yang bisa dipilih di bawah.</p>
            </Field>
          )}
          <Field label="Nama Promo">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Diskon Akhir Pekan 15%" />
          </Field>
          <Field label="Deskripsi">
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ditampilkan ke kasir" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipe Diskon">
              <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as PromoType })}>
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Potongan Tetap (Rp)</option>
              </Select>
            </Field>
            <Field label={form.type === 'percentage' ? 'Nilai (%)' : 'Nilai (Rp)'}>
              <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required min={0} />
            </Field>
          </div>
          <Field label="Minimal Belanja (Rp)">
            <Input type="number" value={form.minPurchase} onChange={e => setForm({ ...form, minPurchase: e.target.value })} min={0} />
          </Field>
          <Field label="Kategori Berlaku (kosongkan = semua kategori)">
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    form.categories.includes(cat) ? 'border-leaf bg-leaf/10 text-leaf' : 'border-ink/15 text-ink-soft',
                  )}>
                  {cat}
                </button>
              ))}
            </div>
          </Field>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Store
            </label>
            {scopedStores.length === 0 ? (
              <div className="rounded-lg border border-dashed border-ink/15 bg-paper-dim/40 px-3 py-3 text-center text-xs text-ink-soft">
                {formMerchantId
                  ? 'Merchant ini belum punya store.'
                  : 'Pilih merchant terlebih dahulu untuk menampilkan daftar store-nya.'}
              </div>
            ) : (
              <div className="space-y-1.5 rounded-lg border border-ink/10 p-3">
                {scopedStores.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" checked={form.storeIds.includes(s.id)} onChange={() => toggleStore(s.id)} />
                    {s.name}
                  </label>
                ))}
                <p className="pt-1 text-xs text-ink-soft">Kosongkan semua = berlaku di setiap store merchant ini.</p>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
            Aktifkan promo ini
          </label>
          <Btn type="submit" className="w-full">{editing ? 'Simpan Perubahan' : 'Tambah Promo'}</Btn>
        </form>
      </Modal>
    </AppShell>
  );
}
