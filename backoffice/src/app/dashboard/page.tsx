'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CircleDollarSign, Package, Receipt } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { reportApi } from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import { PAYMENT_METHOD_LABEL } from '@/lib/constants';
import { DashboardData } from '@/lib/types';
import { useMerchantScope } from '@/lib/MerchantScopeContext';

export default function DashboardPage() {
  const { merchantId, apiMerchantId, isSuperadmin } = useMerchantScope();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return; // still waiting for auth/merchant-scope to resolve
    setLoading(true);
    // Defensively normalize list fields — a nil Go slice marshals to JSON
    // `null`, not `[]`, so don't assume the backend never sends that.
    reportApi
      .dashboard(undefined, 7, apiMerchantId)
      .then(d =>
        setData({
          ...d,
          salesTrend: d.salesTrend ?? [],
          paymentBreakdown: d.paymentBreakdown ?? [],
          topProducts: d.topProducts ?? [],
          leastProducts: d.leastProducts ?? [],
        }),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId, isSuperadmin]);

  return (
    <AppShell title="Dashboard" subtitle="Ringkasan performa toko 7 hari terakhir">
      {loading || !data ? (
        <p className="text-sm text-ink-soft">Memuat…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Transaksi Hari Ini" value={data.todayTransactionCount} icon={<Receipt size={18} />} />
            <StatCard label="Omzet Hari Ini" value={formatRupiah(data.todayRevenue)} icon={<CircleDollarSign size={18} />} />
            <StatCard label="Produk Terjual (7 hari)" value={data.topProducts.reduce((s, p) => s + p.qtySold, 0)} icon={<Package size={18} />} />
            <StatCard
              label="Stok Menipis"
              value={data.lowStockCount}
              icon={<AlertTriangle size={18} />}
              tone={data.lowStockCount > 0 ? 'alert' : 'default'}
            />
          </div>

          <Card>
            <h2 className="mb-4 font-display text-sm font-bold text-ink">Tren Penjualan (7 hari)</h2>
            {data.salesTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-soft">Belum ada transaksi lunas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.salesTrend}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E9E4C" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2E9E4C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1B1814" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5B584E' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#5B584E' }} axisLine={false} tickLine={false} width={70} tickFormatter={v => formatRupiah(v)} />
                  <Tooltip
                    formatter={(value) => [formatRupiah(Number(value)), 'Omzet']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #1C1B181A', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2E9E4C" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 font-display text-sm font-bold text-ink">Metode Pembayaran</h2>
              {data.paymentBreakdown.length === 0 ? (
                <p className="text-sm text-ink-soft">Belum ada data.</p>
              ) : (
                <div className="space-y-3">
                  {data.paymentBreakdown.map(p => (
                    <div key={p.method} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</span>
                      <span className="text-ink-soft">{p.paymentCount}x · {formatRupiah(p.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 font-display text-sm font-bold text-ink">Produk Terlaris</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-ink-soft">Belum ada data.</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map(p => (
                    <div key={p.productId} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{p.name}</span>
                      <span className="text-ink-soft">{p.qtySold} terjual · {formatRupiah(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
