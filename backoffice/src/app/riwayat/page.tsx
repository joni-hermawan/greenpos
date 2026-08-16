'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { transactionApi } from '@/lib/api';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { PAYMENT_METHOD_LABEL } from '@/lib/constants';
import { TransactionDetail, TransactionHistoryRow } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ALL_MERCHANTS, useMerchantScope } from '@/lib/MerchantScopeContext';

export default function RiwayatPage() {
  const { merchantId, apiMerchantId, isSuperadmin, merchantNameById } = useMerchantScope();
  const showMerchantColumn = merchantId === ALL_MERCHANTS;
  const [rows, setRows] = useState<TransactionHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<TransactionDetail | null>(null);

  useEffect(() => {
    if (!merchantId) return; // still waiting for auth/merchant-scope to resolve
    setLoading(true);
    transactionApi
      .history(undefined, 30, apiMerchantId)
      .then(setRows)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId, isSuperadmin]);

  const filtered = rows.filter(r => r.invoiceNo.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="Riwayat Transaksi" subtitle="Transaksi 30 hari terakhir, semua store">
      <Card>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nomor invoice…"
          className="mb-4 w-full max-w-xs rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-leaf"
        />

        {loading ? (
          <p className="py-8 text-center text-sm text-ink-soft">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">Tidak ada transaksi ditemukan.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <th className="pb-2">Invoice</th>
                <th className="pb-2">Waktu</th>
                {showMerchantColumn && <th className="pb-2">Merchant</th>}
                <th className="pb-2">Kasir</th>
                <th className="pb-2">Metode</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr
                  key={r.id}
                  className="cursor-pointer border-b border-ink/5 hover:bg-paper-dim"
                  onClick={() => transactionApi.detail(r.id, r.merchantId).then(setDetail)}>
                  <td className="py-2.5 font-medium text-ink">{r.invoiceNo}</td>
                  <td className="py-2.5 text-ink-soft">{formatDateTime(r.createdAt)}</td>
                  {showMerchantColumn && <td className="py-2.5 text-ink-soft">{merchantNameById(r.merchantId)}</td>}
                  <td className="py-2.5 text-ink-soft">{r.cashierName}</td>
                  <td className="py-2.5 text-ink-soft">{PAYMENT_METHOD_LABEL[r.method] ?? r.method}</td>
                  <td className="py-2.5">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        r.status === 'paid' ? 'bg-teal/10 text-teal' : 'bg-alert/10 text-alert',
                      )}>
                      {r.status === 'paid' ? 'Lunas' : 'Dibatalkan'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-ink">{formatRupiah(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.invoiceNo ?? ''}>
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="space-y-1.5 border-b border-ink/10 pb-3">
              {detail.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-ink">{it.qty}x {it.name}</span>
                  <span className="text-ink-soft">{formatRupiah(it.qty * it.unitPrice)}</span>
                </div>
              ))}
            </div>
            {detail.discount > 0 && (
              <div className="flex justify-between text-teal">
                <span>Diskon {detail.promoName}</span>
                <span>-{formatRupiah(detail.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-ink">
              <span>Total</span>
              <span>{formatRupiah(detail.total)}</span>
            </div>
            <div className="border-t border-ink/10 pt-3 text-xs text-ink-soft">
              <p>{detail.storeName} · {detail.cashierName}</p>
              <p>{formatDateTime(detail.createdAt)} · {PAYMENT_METHOD_LABEL[detail.method] ?? detail.method}</p>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
