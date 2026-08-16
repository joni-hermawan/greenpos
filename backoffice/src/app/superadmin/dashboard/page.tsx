'use client';

import { useEffect, useState } from 'react';
import { AlertOctagon, Building2, CircleDollarSign, Receipt, Store } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { platformApi } from '@/lib/api';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { PlatformDashboard } from '@/lib/types';

export default function SuperadminDashboardPage() {
  const [data, setData] = useState<PlatformDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Defensively normalize list fields — a nil Go slice marshals to JSON
    // `null`, not `[]`, so don't assume the backend never sends that.
    platformApi
      .dashboard()
      .then(d => setData({ ...d, merchantHealth: d.merchantHealth ?? [], stuckPending: d.stuckPending ?? [] }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Dashboard Platform" subtitle="Monitor seluruh merchant, store, dan transaksi">
      {loading || !data ? (
        <p className="text-sm text-ink-soft">Memuat…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Merchant Aktif" value={`${data.activeMerchantCount} / ${data.merchantCount}`} icon={<Building2 size={18} />} />
            <StatCard label="Store Aktif" value={`${data.activeStoreCount} / ${data.storeCount}`} icon={<Store size={18} />} />
            <StatCard label="Transaksi Hari Ini" value={data.todayTransactionCount} icon={<Receipt size={18} />} />
            <StatCard label="Omzet Hari Ini" value={formatRupiah(data.todayRevenue)} icon={<CircleDollarSign size={18} />} />
          </div>

          <Card>
            <h2 className="mb-4 font-display text-sm font-bold text-ink">Kesehatan Merchant</h2>
            {data.merchantHealth.length === 0 ? (
              <p className="text-sm text-ink-soft">Belum ada merchant.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    <th className="pb-2">Merchant</th>
                    <th className="pb-2 text-right">Transaksi Hari Ini</th>
                    <th className="pb-2 text-right">Omzet Hari Ini</th>
                    <th className="pb-2 text-right">Pending</th>
                    <th className="pb-2 text-right">Aktivitas Terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {data.merchantHealth.map(m => (
                    <tr key={m.merchantId} className="border-b border-ink/5">
                      <td className="py-2.5 font-medium text-ink">{m.merchantName}</td>
                      <td className="py-2.5 text-right text-ink-soft">{m.paidCountToday}</td>
                      <td className="py-2.5 text-right text-ink-soft">{formatRupiah(m.paidTotalToday)}</td>
                      <td className="py-2.5 text-right text-ink-soft">{m.pendingCount}</td>
                      <td className="py-2.5 text-right text-ink-soft">{m.lastActivityAt ? formatDateTime(m.lastActivityAt) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-ink">
              <AlertOctagon size={16} className="text-alert" /> Pesanan Pending Macet ({'>'}30 menit)
            </h2>
            {data.stuckPending.length === 0 ? (
              <p className="text-sm text-ink-soft">Tidak ada — semua pesanan pending masih wajar.</p>
            ) : (
              <div className="space-y-2">
                {data.stuckPending.map(r => (
                  <div key={r.transactionId} className="flex items-center justify-between rounded-lg border border-alert/20 bg-alert/5 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-ink">{r.invoiceNo} · {r.merchantName} / {r.storeName}</p>
                      <p className="text-xs text-ink-soft">{formatDateTime(r.createdAt)} · {r.minutesStuck} menit lalu</p>
                    </div>
                    <p className="font-semibold text-ink">{formatRupiah(r.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
