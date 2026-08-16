'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Key, Plus, Search, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Btn } from '@/components/ui/Btn';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { edcTerminalApi, storeApi, userApi } from '@/lib/api';
import { ASSIGNABLE_PAGES, PAGE_META, PageId } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { EdcTerminal, Store, UserSummary } from '@/lib/types';
import { ALL_MERCHANTS, useMerchantScope } from '@/lib/MerchantScopeContext';

const EMPTY_FORM = { username: '', password: '', name: '', allowedPages: [] as PageId[], storeIds: [] as string[], edcTerminalId: '' };

export default function UsersPage() {
  const { showToast } = useToast();
  const { merchantId, apiMerchantId, isSuperadmin, merchants, merchantNameById } = useMerchantScope();
  const showMerchantColumn = merchantId === ALL_MERCHANTS;
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Create/edit: name, menu access, and store data filter all live in
  // one form now — no more picking a role tier, no more a store locked to
  // certain roles only. Every account gets an explicit menu grant + an
  // explicit (optional) store scope. ---
  const [editing, setEditing] = useState<UserSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createMerchantId, setCreateMerchantId] = useState('');
  const [saving, setSaving] = useState(false);

  // --- Reset password ---
  const [resetting, setResetting] = useState<UserSummary | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // --- Data filter: search + menu + store + status, so an admin managing
  // many staff can quickly narrow down to exactly who they're looking for.
  const [search, setSearch] = useState('');
  const [pageFilter, setPageFilter] = useState<PageId | 'all'>('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  function load() {
    if (!merchantId) return; // still waiting for auth/merchant-scope to resolve
    setLoading(true);
    Promise.all([userApi.list(apiMerchantId), storeApi.list(apiMerchantId)])
      .then(([u, s]) => {
        setUsers(u);
        setStores(s);
      })
      .finally(() => setLoading(false));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [merchantId, isSuperadmin]);

  const storeName = useMemo(() => {
    const map = new Map(stores.map(s => [s.id, s.name]));
    return (id: string) => map.get(id) ?? '-';
  }, [stores]);

  const initial = (name: string) => (name || '?').trim().charAt(0).toUpperCase();

  const filtered = users.filter(u => {
    if (search && !`${u.name} ${u.username}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (pageFilter !== 'all' && !u.allowedPages.includes(pageFilter)) return false;
    if (storeFilter !== 'all' && u.storeIds.length > 0 && !u.storeIds.includes(storeFilter)) return false;
    if (statusFilter === 'active' && !u.active) return false;
    if (statusFilter === 'inactive' && u.active) return false;
    return true;
  });

  // Which merchant the create/edit form's store checkboxes should be
  // scoped to — the account being edited already belongs to one merchant;
  // for a brand-new account under "Semua Merchant" it's whichever merchant
  // was just picked in the form.
  const formMerchantId = editing ? editing.merchantId : (showMerchantColumn ? createMerchantId : apiMerchantId);
  const scopedStores = stores.filter(s => s.merchantId === formMerchantId);

  // EDC terminal pin only makes sense once the account is scoped to
  // exactly one store — a multi-store account can't be pinned to one
  // terminal, and "every store" (empty storeIds) has no single store to
  // even look terminals up for.
  const [storeTerminals, setStoreTerminals] = useState<EdcTerminal[]>([]);
  const singleStoreId = form.storeIds.length === 1 ? form.storeIds[0] : '';
  useEffect(() => {
    if (!singleStoreId) {
      setStoreTerminals([]);
      return;
    }
    edcTerminalApi.listByStore(singleStoreId, formMerchantId).then(setStoreTerminals);
  }, [singleStoreId, formMerchantId]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    // Cross-merchant mode starts with no merchant chosen — the store list
    // below only populates once one is picked, so the merchant-then-store
    // dependency is unmissable rather than silently pre-filled.
    setCreateMerchantId(showMerchantColumn ? '' : apiMerchantId ?? '');
    setModalOpen(true);
  }

  function openEdit(u: UserSummary) {
    setEditing(u);
    setForm({ username: u.username, password: '', name: u.name, allowedPages: u.allowedPages as PageId[], storeIds: u.storeIds, edcTerminalId: u.edcTerminalId ?? '' });
    setModalOpen(true);
  }

  function togglePage(page: PageId) {
    setForm(f => ({
      ...f,
      allowedPages: f.allowedPages.includes(page) ? f.allowedPages.filter(p => p !== page) : [...f.allowedPages, page],
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
    setSaving(true);
    try {
      if (editing) {
        await Promise.all([
          userApi.update(editing.id, { name: form.name, allowedPages: form.allowedPages }),
          userApi.setStoreFilter(editing.id, form.storeIds),
          userApi.setEDCTerminal(editing.id, singleStoreId ? form.edcTerminalId : ''),
        ]);
      } else {
        await userApi.create({
          username: form.username, password: form.password, name: form.name,
          merchantId: isSuperadmin ? (showMerchantColumn ? createMerchantId : apiMerchantId) : undefined,
          storeIds: form.storeIds, allowedPages: form.allowedPages,
          edcTerminalId: singleStoreId ? form.edcTerminalId : undefined,
        });
      }
      showToast({ type: 'success', message: editing ? 'Pengguna diperbarui' : 'Pengguna ditambahkan' });
      setModalOpen(false);
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal menyimpan pengguna', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(u: UserSummary, active: boolean) {
    if (!active && !confirm(`Nonaktifkan akun "${u.name}"? Mereka tidak akan bisa masuk lagi.`)) return;
    try {
      await userApi.setActive(u.id, active);
      showToast({ type: 'success', message: active ? 'Akun diaktifkan' : 'Akun dinonaktifkan' });
      load();
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal mengubah status akun', description: err instanceof Error ? err.message : undefined });
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetting || newPassword.length < 6) return;
    try {
      await userApi.resetPassword(resetting.id, newPassword);
      showToast({ type: 'success', message: `Password ${resetting.name} berhasil direset` });
      setResetting(null);
      setNewPassword('');
    } catch (err) {
      showToast({ type: 'error', message: 'Gagal reset password', description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <AppShell title="Pengguna" subtitle="Kelola akun staff, akses menu, dan cakupan store">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">{filtered.length} dari {users.length} pengguna</p>
          <Btn onClick={openCreate} ch={<><Plus size={15} /> Tambah Pengguna</>} />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="relative col-span-2 sm:col-span-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <Input placeholder="Cari nama/username…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={pageFilter} onChange={e => setPageFilter(e.target.value as PageId | 'all')}>
            <option value="all">Semua Menu</option>
            {ASSIGNABLE_PAGES.map(p => (
              <option key={p} value={p}>{PAGE_META[p].title}</option>
            ))}
          </Select>
          <Select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}>
            <option value="all">Semua Store</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </Select>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-soft">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">Tidak ada pengguna yang cocok dengan filter.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-ink/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper-dim/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5">Nama</th>
                <th className="px-4 py-2.5">{showMerchantColumn ? 'Merchant & Store' : 'Store'}</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filtered.map(u => (
                <tr key={u.id} className="align-top transition-colors hover:bg-paper-dim/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-leaf/15 text-xs font-bold text-leaf">
                        {initial(u.name)}
                      </div>
                      <div>
                        <p className="font-medium text-ink">{u.name}</p>
                        <p className="text-xs text-ink-soft">{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {showMerchantColumn && <p className="text-xs font-medium text-ink">{merchantNameById(u.merchantId)}</p>}
                    <p>{u.storeIds.length === 0 ? 'Semua store' : u.storeIds.map(storeName).join(', ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', u.active ? 'bg-teal/10 text-teal' : 'bg-ink/10 text-ink-soft')}>
                      {u.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(u)} title="Ubah akses & cakupan" className="rounded-md p-1.5 text-ink-soft hover:bg-paper-dim hover:text-ink">
                        <ShieldCheck size={15} />
                      </button>
                      <button onClick={() => setResetting(u)} title="Reset password" className="rounded-md p-1.5 text-ink-soft hover:bg-paper-dim hover:text-ink">
                        <Key size={15} />
                      </button>
                      <button
                        onClick={() => handleSetActive(u, !u.active)}
                        className="rounded-md px-2 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-dim">
                        {u.active ? 'Nonaktifkan' : 'Aktifkan'}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Ubah Akses Pengguna' : 'Tambah Pengguna'}>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Username">
                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required autoCapitalize="none" />
              </Field>
              <Field label="Password">
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </Field>
            </div>
          )}
          <Field label="Nama Lengkap">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </Field>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Akses Menu
            </label>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-ink/10 p-3">
              {ASSIGNABLE_PAGES.map(p => (
                <label key={p} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form.allowedPages.includes(p)} onChange={() => togglePage(p)} />
                  {PAGE_META[p].title}
                </label>
              ))}
            </div>
          </div>

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
                <p className="pt-1 text-xs text-ink-soft">Kosongkan semua = akses ke setiap store di merchant ini.</p>
              </div>
            )}
          </div>

          {singleStoreId && storeTerminals.length > 1 && (
            <Field label="Terminal EDC">
              <Select value={form.edcTerminalId} onChange={e => setForm({ ...form, edcTerminalId: e.target.value })}>
                <option value="">Otomatis (terminal aktif pertama)</option>
                {storeTerminals.map(t => (
                  <option key={t.id} value={t.id}>{t.label}{!t.active && ' (nonaktif)'}</option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-ink-soft">
                Store ini punya lebih dari satu terminal EDC — pilih terminal mana yang dipakai akun ini saat menerima pembayaran EDC di mobile.
              </p>
            </Field>
          )}

          <Btn type="submit" className="w-full" loading={saving} disabled={saving}>
            {editing ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </Btn>
        </form>
      </Modal>

      <Modal open={!!resetting} onClose={() => setResetting(null)} title={`Reset Password — ${resetting?.name ?? ''}`}>
        <form onSubmit={handleResetPassword} className="space-y-3">
          <Field label="Password Baru">
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
          </Field>
          <Btn type="submit" className="w-full" disabled={newPassword.length < 6}>Reset Password</Btn>
        </form>
      </Modal>
    </AppShell>
  );
}
