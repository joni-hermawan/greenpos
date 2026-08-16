'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Store as StoreIcon } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Btn } from '@/components/ui/Btn';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { storeApi } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Store } from '@/lib/types';
import { ALL_MERCHANTS, useMerchantScope } from '@/lib/MerchantScopeContext';

const EMPTY_FORM = { name: '', address: '' };

export default function StoresPage() {
  const { showToast } = useToast();
  const { merchantId, apiMerchantId, isSuperadmin, merchants, merchantNameById } = useMerchantScope();
  const showMerchantColumn = merchantId === ALL_MERCHANTS;
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Store | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createMerchantId, setCreateMerchantId] = useState('');

  function load() {
    if (!merchantId) return; // still waiting for auth/merchant-scope to resolve
    setLoading(true);
    storeApi.list(apiMerchantId).then(setStores).finally(() => setLoading(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [merchantId, isSuperadmin]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCreateMerchantId(showMerchantColumn ? '' : apiMerchantId ?? '');
    setModalOpen(true);
  }

  function openEdit(s: Store) {
    setEditing(s);
    setForm({ name: s.name, address: s.address });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Editing keeps the store's existing merchant; creating under "Semua
    // Merchant" needs an explicit target since there's no ambient one.
    const targetMerchantId = editing ? editing.merchantId : (showMerchantColumn ? createMerchantId : apiMerchantId);
    try {
      if (editing) await storeApi.update(editing.id, form, targetMerchantId);
      else await storeApi.create(form, targetMerchantId);
      showToast({ type: 'success', message: editing ? 'Store diperbarui' : 'Store ditambahkan' });
      setModalOpen(false);
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menyimpan store', description: err instanceof Error ? err.message : undefined });
    }
  }

  async function handleSetActive(s: Store, active: boolean) {
    if (!active && !confirm(`Nonaktifkan store "${s.name}"? Kasir di store ini tidak akan bisa membuat transaksi baru.`)) return;
    try {
      await storeApi.setActive(s.id, active);
      showToast({ type: 'success', message: active ? 'Store diaktifkan' : 'Store dinonaktifkan' });
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal mengubah status store', description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <AppShell title="Stores" subtitle="Kelola cabang/outlet merchant Anda">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">{stores.length} store aktif</p>
          <Btn onClick={openCreate} ch={<><Plus size={15} /> Tambah Store</>} />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-soft">Memuat…</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-dim/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-2.5">Store</th>
                  {showMerchantColumn && <th className="px-4 py-2.5">Merchant</th>}
                  <th className="px-4 py-2.5">Alamat</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {stores.map(s => (
                  <tr key={s.id} className="align-top transition-colors hover:bg-paper-dim/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-leaf/15 text-leaf">
                          <StoreIcon size={14} />
                        </div>
                        <p className="font-medium text-ink">{s.name}</p>
                      </div>
                    </td>
                    {showMerchantColumn && <td className="px-4 py-3 text-ink-soft">{merchantNameById(s.merchantId)}</td>}
                    <td className="px-4 py-3 text-ink-soft">{s.address}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', s.active ? 'bg-teal/10 text-teal' : 'bg-ink/10 text-ink-soft')}>
                        {s.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(s)} title="Edit" className="rounded-md p-1.5 text-ink-soft hover:bg-paper-dim hover:text-ink">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleSetActive(s, !s.active)}
                          className="rounded-md px-2 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-dim">
                          {s.active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Store' : 'Tambah Store'}>
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
          <Field label="Nama Store">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Cabang Bandung" />
          </Field>
          <Field label="Alamat">
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
          </Field>
          <Btn type="submit" className="w-full">{editing ? 'Simpan Perubahan' : 'Tambah Store'}</Btn>
        </form>
      </Modal>
    </AppShell>
  );
}
