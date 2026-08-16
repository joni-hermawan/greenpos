'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Btn } from '@/components/ui/Btn';
import { Field, Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { productApi } from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Product } from '@/lib/types';
import { ALL_MERCHANTS, useMerchantScope } from '@/lib/MerchantScopeContext';
import { Select } from '@/components/ui/Input';

const EMPTY_FORM = { sku: '', name: '', category: '', price: '', stock: '', minStock: '', emoji: '🛒', imageUrl: '' };

export default function ProdukPage() {
  const { showToast } = useToast();
  const { merchantId, apiMerchantId, isSuperadmin, merchants, merchantNameById } = useMerchantScope();
  const showMerchantColumn = merchantId === ALL_MERCHANTS;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createMerchantId, setCreateMerchantId] = useState('');
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');

  function load() {
    if (!merchantId) return; // still waiting for auth/merchant-scope to resolve
    setLoading(true);
    productApi.list(apiMerchantId).then(setProducts).finally(() => setLoading(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [merchantId, isSuperadmin]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCreateMerchantId(showMerchantColumn ? '' : apiMerchantId ?? '');
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku, name: p.name, category: p.category,
      price: String(p.price), stock: String(p.stock), minStock: String(p.minStock),
      emoji: p.emoji, imageUrl: p.imageUrl ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = {
      sku: form.sku, name: form.name, category: form.category,
      price: Number(form.price) || 0, stock: Number(form.stock) || 0,
      minStock: Number(form.minStock) || 0, emoji: form.emoji || '🛒',
      imageUrl: form.imageUrl || undefined,
    };
    // Editing keeps the product's existing merchant; creating under "Semua
    // Merchant" needs an explicit target since there's no ambient one.
    const targetMerchantId = editing ? editing.merchantId : (showMerchantColumn ? createMerchantId : apiMerchantId);
    try {
      if (editing) await productApi.update(editing.id, input, targetMerchantId);
      else await productApi.create(input, targetMerchantId);
      showToast({ type: 'success', message: editing ? 'Produk diperbarui' : 'Produk ditambahkan' });
      setModalOpen(false);
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menyimpan produk', description: err instanceof Error ? err.message : undefined });
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      await productApi.delete(p.id, p.merchantId);
      showToast({ type: 'success', message: 'Produk dihapus' });
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menghapus produk', description: err instanceof Error ? err.message : undefined });
    }
  }

  async function handleAdjust(e: FormEvent) {
    e.preventDefault();
    if (!adjusting) return;
    const delta = Number(adjustDelta);
    if (!delta) return;
    try {
      await productApi.adjustStock(adjusting.id, delta, 'Penyesuaian manual dari back-office', adjusting.merchantId);
      showToast({ type: 'success', message: `Stok ${adjusting.name} disesuaikan ${delta > 0 ? '+' : ''}${delta}` });
      setAdjusting(null);
      setAdjustDelta('');
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menyesuaikan stok', description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <AppShell title="Produk & Stok" subtitle="Kelola katalog produk dan mutasi stok">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">{products.length} produk</p>
          <Btn onClick={openCreate} ch={<><Plus size={15} /> Tambah Produk</>} />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-soft">Memuat…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <th className="pb-2">Produk</th>
                <th className="pb-2">Kategori</th>
                {showMerchantColumn && <th className="pb-2">Merchant</th>}
                <th className="pb-2 text-right">Harga</th>
                <th className="pb-2 text-right">Stok</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const low = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="border-b border-ink/5">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{p.emoji}</span>
                        <div>
                          <p className="font-medium text-ink">{p.name}</p>
                          <p className="text-xs text-ink-soft">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-ink-soft">{p.category}</td>
                    {showMerchantColumn && <td className="py-2.5 text-ink-soft">{merchantNameById(p.merchantId)}</td>}
                    <td className="py-2.5 text-right text-ink">{formatRupiah(p.price)}</td>
                    <td className="py-2.5 text-right">
                      <span className={cn('inline-flex items-center gap-1 font-semibold', low ? 'text-alert' : 'text-ink')}>
                        {low && <AlertTriangle size={13} />}
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setAdjusting(p)} title="Sesuaikan stok" className="rounded-md p-1.5 text-ink-soft hover:bg-paper-dim hover:text-ink">
                          <Plus size={15} />
                        </button>
                        <button onClick={() => openEdit(p)} title="Edit" className="rounded-md p-1.5 text-ink-soft hover:bg-paper-dim hover:text-ink">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(p)} title="Hapus" className="rounded-md p-1.5 text-ink-soft hover:bg-alert/10 hover:text-alert">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Produk' : 'Tambah Produk'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editing && showMerchantColumn && (
            <Field label="Merchant">
              <Select value={createMerchantId} onChange={e => setCreateMerchantId(e.target.value)} required>
                <option value="" disabled>Pilih merchant…</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU">
              <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
            </Field>
            <Field label="Emoji">
              <Input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} maxLength={4} />
            </Field>
          </div>
          <Field label="Nama Produk">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Kategori">
            <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required placeholder="Minuman, Roti, Snack, Makanan…" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Harga">
              <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required min={0} />
            </Field>
            <Field label="Stok Awal">
              <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required min={0} />
            </Field>
            <Field label="Stok Minimum">
              <Input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} min={0} />
            </Field>
          </div>
          <ImageUpload label="Gambar Produk (opsional)" value={form.imageUrl} onChange={imageUrl => setForm({ ...form, imageUrl })} />
          <Btn type="submit" className="w-full">{editing ? 'Simpan Perubahan' : 'Tambah Produk'}</Btn>
        </form>
      </Modal>

      <Modal open={!!adjusting} onClose={() => setAdjusting(null)} title={`Sesuaikan Stok — ${adjusting?.name ?? ''}`}>
        <form onSubmit={handleAdjust} className="space-y-3">
          <p className="text-sm text-ink-soft">Stok saat ini: <span className="font-semibold text-ink">{adjusting?.stock}</span></p>
          <Field label="Perubahan (+/-)">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setAdjustDelta(String((Number(adjustDelta) || 0) - 1))} className="rounded-lg border border-ink/15 p-2 hover:bg-paper-dim">
                <Minus size={15} />
              </button>
              <Input type="number" value={adjustDelta} onChange={e => setAdjustDelta(e.target.value)} className="text-center" />
              <button type="button" onClick={() => setAdjustDelta(String((Number(adjustDelta) || 0) + 1))} className="rounded-lg border border-ink/15 p-2 hover:bg-paper-dim">
                <Plus size={15} />
              </button>
            </div>
          </Field>
          <Btn type="submit" className="w-full" disabled={!adjustDelta || Number(adjustDelta) === 0}>Simpan Penyesuaian</Btn>
        </form>
      </Modal>
    </AppShell>
  );
}
