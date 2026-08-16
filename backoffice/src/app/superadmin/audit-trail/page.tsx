'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { auditApi, merchantApi } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { roleLabel } from '@/lib/constants';
import { AuditLog, Merchant } from '@/lib/types';

// Platform-wide by default (merchantId empty = every merchant) — a
// superadmin investigating a complaint narrows down with the merchant
// filter and/or the search box (matches action/target/actor).
export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantFilter, setMerchantFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    merchantApi.list().then(setMerchants);
  }, []);

  useEffect(() => {
    setLoading(true);
    auditApi
      .list(merchantFilter === 'all' ? undefined : merchantFilter, 300)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [merchantFilter]);

  const merchantName = useMemo(() => {
    const map = new Map(merchants.map(m => [m.id, m.name]));
    return (id?: string) => (id ? map.get(id) ?? id : '-');
  }, [merchants]);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const haystack = `${l.actorName} ${l.action} ${l.target ?? ''} ${l.detail ?? ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <AppShell title="Audit Trail" subtitle="Riwayat aksi lintas merchant — untuk menelusuri komplain dari merchant/store">
      <Card>
        <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari aksi, target, atau pelaku…"
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-leaf sm:col-span-2"
          />
          <select
            value={merchantFilter}
            onChange={e => setMerchantFilter(e.target.value)}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm">
            <option value="all">Semua Merchant</option>
            {merchants.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-soft">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">Tidak ada aktivitas yang cocok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <th className="pb-2">Waktu</th>
                <th className="pb-2">Pelaku</th>
                <th className="pb-2">Merchant</th>
                <th className="pb-2">Aksi</th>
                <th className="pb-2">Target / Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-ink/5 align-top">
                  <td className="whitespace-nowrap py-2.5 text-ink-soft">{formatDateTime(l.timestamp)}</td>
                  <td className="py-2.5">
                    <p className="font-medium text-ink">{l.actorName}</p>
                    <p className="text-xs text-ink-soft">{roleLabel(l.actorRole)}</p>
                  </td>
                  <td className="py-2.5 text-ink-soft">{merchantName(l.merchantId)}</td>
                  <td className="py-2.5">
                    <code className="rounded bg-paper-dim px-1.5 py-0.5 text-xs text-ink">{l.action}</code>
                  </td>
                  <td className="py-2.5 text-ink-soft">
                    {l.target}
                    {l.detail && <span className="text-ink-soft/70"> — {l.detail}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
