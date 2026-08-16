import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ReceiptView } from '../components/ReceiptView';
import { transactionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatRupiah } from '../format';
import { shared } from '../sharedStyles';
import { colors } from '../theme';
import { TransactionDetail, TransactionHistoryRow } from '../types';

const METHOD_LABEL: Record<string, string> = { cash: 'Cash', qris: 'QRIS', edc: 'EDC' };

export function RiwayatTransaksiScreen({ storeId }: { storeId: string }) {
  const { user } = useAuth();

  const [rows, setRows] = useState<TransactionHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    transactionApi
      .history(storeId)
      .then(setRows)
      .catch(err => setError(err instanceof Error ? err.message : 'Gagal memuat riwayat transaksi.'))
      .finally(() => setLoading(false));
  }
  useEffect(load, [storeId]);

  async function openDetail(id: string) {
    setLoadingDetail(true);
    try {
      setDetail(await transactionApi.detail(id));
    } finally {
      setLoadingDetail(false);
    }
  }

  const filtered = rows.filter(r => r.invoiceNo.toLowerCase().includes(query.toLowerCase()));

  if (detail) {
    const change = detail.amountReceived !== null ? detail.amountReceived - detail.total : undefined;
    return (
      <View style={shared.container}>
        <ScrollView contentContainerStyle={styles.receiptScreen}>
          <TouchableOpacity onPress={() => setDetail(null)}>
            <Text style={shared.backLink}>← Kembali ke daftar</Text>
          </TouchableOpacity>
          {detail.status === 'voided' ? (
            <View style={styles.voidedBox}>
              <Text style={styles.voidedText}>
                Transaksi ini dibatalkan (voided) — tidak pernah ada pembayaran yang selesai.
              </Text>
            </View>
          ) : (
            <ReceiptView
              merchantName={user?.merchantName || 'Toko'}
              storeName={detail.storeName}
              storeAddress={detail.storeAddress}
              invoiceNo={detail.invoiceNo}
              cashierName={detail.cashierName}
              items={detail.items.map(i => ({ name: i.name, qty: i.qty, price: i.unitPrice }))}
              subtotal={detail.subtotal}
              discount={detail.discount}
              promoName={detail.promoName}
              total={detail.total}
              paid
              method={METHOD_LABEL[detail.method] ?? detail.method}
              amountReceived={detail.amountReceived ?? undefined}
              change={change}
              meta={detail.meta}
              paidAt={formatDateTime(detail.createdAt)}
            />
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={shared.container}>
      <AppHeader title="Riwayat Transaksi" subtitle="30 hari terakhir" />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Cari nomor invoice…"
        style={[shared.searchInput, styles.searchBounds]}
      />

      {error && <Text style={[shared.errorText, { marginHorizontal: 16 }]}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.register} />
      ) : filtered.length === 0 ? (
        <View style={shared.emptyBox}>
          <Text style={shared.emptyTitle}>Belum ada transaksi</Text>
          <Text style={shared.emptySubtitle}>
            Transaksi yang sudah dibayar atau dibatalkan akan muncul di sini.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.map(r => (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              disabled={loadingDetail}
              onPress={() => openDetail(r.id)}>
              <View style={styles.cardTopRow}>
                <Text style={styles.invoiceLabel}>{r.invoiceNo}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: r.status === 'paid' ? `${colors.teal}1A` : `${colors.alert}1A` },
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: r.status === 'paid' ? colors.teal : colors.alert },
                    ]}>
                    {r.status === 'paid' ? 'Selesai' : 'Voided'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTotal}>{formatRupiah(r.total)}</Text>
              <Text style={styles.cardMeta}>
                {formatDateTime(r.createdAt)} · {r.cashierName} ·{' '}
                {METHOD_LABEL[r.method] ?? (r.method || '-')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBounds: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  list: {
    padding: 16,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1B181A',
    padding: 14,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLabel: {
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 4,
  },
  receiptScreen: {
    padding: 16,
    alignItems: 'center',
  },
  voidedBox: {
    backgroundColor: `${colors.alert}1A`,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  voidedText: {
    color: colors.alert,
    fontSize: 13,
    textAlign: 'center',
  },
});
