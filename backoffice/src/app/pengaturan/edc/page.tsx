'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Btn } from '@/components/ui/Btn';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { edcTerminalApi, EdcTerminalInput, storeApi } from '@/lib/api';
import { EdcTerminal, edcPosId, Store } from '@/lib/types';
import { ALL_MERCHANTS, useMerchantScope } from '@/lib/MerchantScopeContext';

const EMPTY_FORM: EdcTerminalInput = { label: '', mode: 'simulator', wsUrl: '', apiKey: '', mid: '', stationCode: '' };

export default function EdcSettingsPage() {
  const { showToast } = useToast();
  const { merchantId, apiMerchantId, merchantNameById } = useMerchantScope();
  // The per-store terminal editor needs one concrete store, so "Semua
  // Merchant" isn't a valid scope for it — the mapping dashboard below is
  // fine with it, since it's read-only and joins in merchant/store names.
  const scopedToAll = merchantId === ALL_MERCHANTS;

  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState('');
  const [terminals, setTerminals] = useState<EdcTerminal[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<EdcTerminal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<EdcTerminalInput>(EMPTY_FORM);

  const [mapping, setMapping] = useState<EdcTerminal[]>([]);
  const [mappingStores, setMappingStores] = useState<Store[]>([]);
  const [mappingLoading, setMappingLoading] = useState(true);

  useEffect(() => {
    if (!merchantId || scopedToAll) return;
    storeApi.list(apiMerchantId).then(list => {
      setStores(list);
      setStoreId(prev => (list.some(s => s.id === prev) ? prev : list[0]?.id ?? ''));
    });
  }, [merchantId, apiMerchantId, scopedToAll]);

  function loadTerminals() {
    if (!storeId || scopedToAll) return;
    setLoading(true);
    edcTerminalApi.listByStore(storeId, apiMerchantId).then(setTerminals).finally(() => setLoading(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadTerminals, [storeId, apiMerchantId, scopedToAll]);

  function loadMapping() {
    if (!merchantId) return;
    setMappingLoading(true);
    Promise.all([edcTerminalApi.listMapping(apiMerchantId), storeApi.list(apiMerchantId)])
      .then(([t, st]) => {
        setMapping(t);
        setMappingStores(st);
      })
      .finally(() => setMappingLoading(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadMapping, [merchantId, apiMerchantId]);

  function storeName(id: string) {
    return stores.find(s => s.id === id)?.name ?? mappingStores.find(s => s.id === id)?.name ?? id;
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(t: EdcTerminal) {
    setEditing(t);
    setForm({ label: t.label, mode: t.mode, wsUrl: t.wsUrl ?? '', apiKey: t.apiKey ?? '', mid: t.mid ?? '', stationCode: t.stationCode ?? '' });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editing) await edcTerminalApi.update(editing.id, form, apiMerchantId);
      else await edcTerminalApi.create(storeId, form, apiMerchantId);
      showToast({ type: 'success', message: editing ? 'Terminal diperbarui' : 'Terminal ditambahkan' });
      setModalOpen(false);
      loadTerminals();
      loadMapping();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menyimpan terminal', description: err instanceof Error ? err.message : undefined });
    }
  }

  async function toggleActive(t: EdcTerminal) {
    try {
      await edcTerminalApi.setActive(t.id, !t.active, apiMerchantId);
      loadTerminals();
      loadMapping();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal mengubah status terminal', description: err instanceof Error ? err.message : undefined });
    }
  }

  async function handleDelete(t: EdcTerminal) {
    if (!confirm(`Hapus terminal "${t.label}"?`)) return;
    try {
      await edcTerminalApi.delete(t.id, apiMerchantId);
      showToast({ type: 'success', message: 'Terminal dihapus' });
      loadTerminals();
      loadMapping();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menghapus terminal', description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <AppShell title="Pengaturan EDC" subtitle="Integrasi mesin EDC per store — sesuai TSD Prima Vista Solusi">
      <Card className="max-w-2xl">
        {scopedToAll ? (
          <p className="py-4 text-center text-sm text-ink-soft">Pilih satu merchant tertentu di sidebar untuk mengatur terminal EDC-nya.</p>
        ) : (
          <>
            <Field label="Store">
              <Select value={storeId} onChange={e => setStoreId(e.target.value)}>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>

            <div className="mt-4 mb-3 flex items-center justify-between">
              <p className="text-sm text-ink-soft">
                {terminals.length} terminal di store ini
                {terminals.length > 1 && ' — beberapa terminal berarti beberapa mesin EDC/kasir di store yang sama'}
              </p>
              {storeId && <Btn onClick={openCreate} ch={<><Plus size={15} /> Tambah Terminal</>} />}
            </div>

            {loading ? (
              <p className="py-4 text-center text-sm text-ink-soft">Memuat…</p>
            ) : terminals.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-soft">Belum ada terminal EDC untuk store ini.</p>
            ) : (
              <div className="space-y-3">
                {terminals.map(t => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{t.label}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', t.active ? 'bg-teal/10 text-teal' : 'bg-ink/10 text-ink-soft')}>
                          {t.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', t.mode === 'live' ? 'bg-brass/10 text-brass' : 'bg-ink/5 text-ink-soft')}>
                          {t.mode === 'live' ? 'Live' : 'Simulator'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        Pos ID: <code className="rounded bg-paper-dim px-1">{edcPosId(t) || '(belum diisi)'}</code>
                        {t.mode === 'live' && ` · MID ${t.mid || '-'} · Kode Stasiun ${t.stationCode || '-'}`}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleActive(t)} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-dim">
                        {t.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button onClick={() => openEdit(t)} className="rounded-md p-1.5 text-ink-soft hover:bg-paper-dim hover:text-ink">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(t)} className="rounded-md p-1.5 text-ink-soft hover:bg-alert/10 hover:text-alert">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="mt-6">
        <div className="mb-4">
          <h3 className="font-display text-base font-bold text-ink">Peta Terminal EDC</h3>
          <p className="text-sm text-ink-soft">
            Semua terminal {scopedToAll ? 'di semua merchant' : 'di merchant ini'} dalam satu tabel — supaya mapping Pos ID ↔ store mudah dilihat sekilas.
          </p>
        </div>
        {mappingLoading ? (
          <p className="py-4 text-center text-sm text-ink-soft">Memuat…</p>
        ) : mapping.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">Belum ada terminal EDC.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  <th className="py-2 pr-3">Store</th>
                  {scopedToAll && <th className="py-2 pr-3">Merchant</th>}
                  <th className="py-2 pr-3">Terminal</th>
                  <th className="py-2 pr-3">Pos ID</th>
                  <th className="py-2 pr-3">Mode</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map(t => {
                  const st = mappingStores.find(s => s.id === t.storeId);
                  return (
                    <tr key={t.id} className="border-b border-ink/5 last:border-0">
                      <td className="py-2 pr-3 font-medium text-ink">{st?.name ?? storeName(t.storeId)}</td>
                      {scopedToAll && <td className="py-2 pr-3 text-ink-soft">{merchantNameById(st?.merchantId)}</td>}
                      <td className="py-2 pr-3 text-ink">{t.label}</td>
                      <td className="py-2 pr-3"><code className="rounded bg-paper-dim px-1">{edcPosId(t) || '-'}</code></td>
                      <td className="py-2 pr-3 text-ink-soft">{t.mode === 'live' ? 'Live' : 'Simulator'}</td>
                      <td className="py-2 pr-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', t.active ? 'bg-teal/10 text-teal' : 'bg-ink/10 text-ink-soft')}>
                          {t.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Terminal EDC' : 'Tambah Terminal EDC'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama/Label Terminal">
            <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required placeholder="Kasir 1 / Meja Depan" />
          </Field>
          <Field label="Mode">
            <Select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value as EdcTerminalInput['mode'] })}>
              <option value="simulator">Simulator (tanpa mesin fisik)</option>
              <option value="live">Live (mesin EDC asli)</option>
            </Select>
            <p className="mt-1 text-xs text-ink-soft">
              Simulator langsung menyetujui transaksi dengan data dummy — pakai ini sampai onboarding Prima Vista selesai.
            </p>
          </Field>

          {form.mode === 'live' && (
            <>
              <Field label="WebSocket URL Middleware">
                <Input
                  value={form.wsUrl ?? ''}
                  onChange={e => setForm({ ...form, wsUrl: e.target.value })}
                  placeholder="wss://ecr-ip:port/ws_api_pos/v1/api/"
                />
              </Field>
              <Field label="API Key">
                <Input value={form.apiKey ?? ''} onChange={e => setForm({ ...form, apiKey: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="MID (Merchant ID)">
                  <Input value={form.mid ?? ''} onChange={e => setForm({ ...form, mid: e.target.value })} placeholder="M123" />
                </Field>
                <Field label="Kode Stasiun POS (2 digit)">
                  <Input
                    value={form.stationCode ?? ''}
                    onChange={e => setForm({ ...form, stationCode: e.target.value })}
                    maxLength={2}
                    placeholder="01"
                  />
                </Field>
              </div>
              <p className="text-xs text-ink-soft">
                Kode Stasiun POS bukan dari bank/vendor — ini kode 2 digit yang Anda tentukan sendiri per terminal, cukup unik di antara
                terminal-terminal Anda sendiri yang berbagi MID yang sama. Dipakai sebagai akhiran ID transaksi dan pelengkap Pos ID (MID +
                Kode Stasiun) di atas. Sertifikat mTLS &amp; signing key diatur di server (file <code className="rounded bg-paper-dim px-1">.env</code>),
                berlaku untuk semua store.
              </p>
            </>
          )}

          <Btn type="submit" className="w-full">{editing ? 'Simpan Perubahan' : 'Tambah Terminal'}</Btn>
        </form>
      </Modal>
    </AppShell>
  );
}
