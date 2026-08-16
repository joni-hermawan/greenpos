'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Building2, Pencil, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Btn } from '@/components/ui/Btn';
import { Field, Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Merchant } from '@/lib/types';

const EMPTY_FORM = { name: '', address: '', logoUrl: '' };

export default function SuperadminMerchantsPage() {
  const { showToast } = useToast();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  function load() {
    setLoading(true);
    merchantApi.list().then(setMerchants).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(m: Merchant) {
    setEditing(m);
    setForm({ name: m.name, address: m.address, logoUrl: m.logoUrl ?? '' });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editing) await merchantApi.update(editing.id, form);
      else await merchantApi.create(form);
      showToast({ type: 'success', message: editing ? 'Merchant diperbarui' : 'Merchant ditambahkan' });
      setModalOpen(false);
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menyimpan merchant', description: err instanceof Error ? err.message : undefined });
    }
  }

  async function handleSetActive(m: Merchant, active: boolean) {
    if (!active && !confirm(`Nonaktifkan merchant "${m.name}"? Semua staff di bawahnya tidak akan bisa masuk.`)) return;
    try {
      await merchantApi.setActive(m.id, active);
      showToast({ type: 'success', message: active ? 'Merchant diaktifkan' : 'Merchant dinonaktifkan' });
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal mengubah status merchant', description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <AppShell title="Merchants" subtitle="Kelola semua merchant yang memakai platform ini">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">{merchants.length} merchant</p>
          <Btn onClick={openCreate} ch={<><Plus size={15} /> Tambah Merchant</>} />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-soft">Memuat…</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-dim/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-2.5">Merchant</th>
                  <th className="px-4 py-2.5">Alamat</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {merchants.map(m => (
                  <tr key={m.id} className="align-top transition-colors hover:bg-paper-dim/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-leaf/15 text-leaf">
                          <Building2 size={14} />
                        </div>
                        <div>
                          <p className="font-medium text-ink">{m.name}</p>
                          <p className="text-xs text-ink-soft">/{m.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{m.address}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', m.active ? 'bg-teal/10 text-teal' : 'bg-ink/10 text-ink-soft')}>
                        {m.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(m)} title="Edit" className="rounded-md p-1.5 text-ink-soft hover:bg-paper-dim hover:text-ink">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleSetActive(m, !m.active)}
                          className="rounded-md px-2 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-dim">
                          {m.active ? 'Nonaktifkan' : 'Aktifkan'}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Merchant' : 'Tambah Merchant'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nama Merchant">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Alamat">
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
          </Field>
          <ImageUpload label="Logo (opsional)" value={form.logoUrl} onChange={logoUrl => setForm({ ...form, logoUrl })} />
          <Btn type="submit" className="w-full">{editing ? 'Simpan Perubahan' : 'Tambah Merchant'}</Btn>
        </form>
      </Modal>
    </AppShell>
  );
}
