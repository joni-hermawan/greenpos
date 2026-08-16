'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { reportApi } from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import { PAYMENT_METHOD_LABEL } from '@/lib/constants';
import { ReconciliationRow } from '@/lib/types';
import { useMerchantScope } from '@/lib/MerchantScopeContext';

export default function ReportingPage() {
  const { merchantId, apiMerchantId, isSuperadmin } = useMerchantScope();
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!merchantId) return; // still waiting for auth/merchant-scope to resolve
    setLoading(true);
    reportApi
      .reconciliation(undefined, days, apiMerchantId)
      .then(setRows)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, merchantId, isSuperadmin]);

  const total = rows.reduce((s, r) => s + r.systemTotal, 0);

  return (
    <AppShell title="Reporting" subtitle="Rekonsiliasi pembayaran per metode, per hari">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">
            Total <span className="font-bold text-ink">{formatRupiah(total)}</span> dari {rows.length} baris
          </p>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm">
            <option value={7}>7 hari terakhir</option>
            <option value={30}>30 hari terakhir</option>
            <option value={90}>90 hari terakhir</option>
          </select>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-soft">Memuat…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">Belum ada transaksi lunas pada periode ini.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <th className="pb-2">Tanggal</th>
                <th className="pb-2">Metode</th>
                <th className="pb-2 text-right">Jumlah Transaksi</th>
                <th className="pb-2 text-right">Total Sistem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={`${r.date}-${r.method}`} className="border-b border-ink/5">
                  <td className="py-2.5 text-ink">{r.date}</td>
                  <td className="py-2.5 text-ink">{PAYMENT_METHOD_LABEL[r.method] ?? r.method}</td>
                  <td className="py-2.5 text-right text-ink-soft">{r.paymentCount}</td>
                  <td className="py-2.5 text-right font-semibold text-ink">{formatRupiah(r.systemTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
