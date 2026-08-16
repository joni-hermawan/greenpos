import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { ReceiptView } from '../components/ReceiptView';
import { SwipeableRow } from '../components/SwipeableRow';
import { transactionApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { formatRupiah } from '../format';
import { shared } from '../sharedStyles';
import { colors } from '../theme';
import { PaymentMeta, PaymentMethod, PendingTransaction, TransactionDetail } from '../types';

interface Props {
  storeId: string;
  autoSelectId?: string | null;
  onConsumeAutoSelect?: () => void;
}

export function PembayaranScreen({ storeId, autoSelectId, onConsumeAutoSelect }: Props) {
  const { user } = useAuth();
  const confirm = useConfirmDialog();

  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PendingTransaction | null>(null);
  const [orderDetail, setOrderDetail] = useState<TransactionDetail | null>(null);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paidInfo, setPaidInfo] = useState<{
    method: PaymentMethod;
    amountReceived?: number;
    meta?: PaymentMeta;
  } | null>(null);

  useEffect(() => {
    if (!selected) {
      setOrderDetail(null);
      return;
    }
    setLoadingOrderItems(true);
    transactionApi
      .detail(selected.id)
      .then(setOrderDetail)
      .catch(() => setOrderDetail(null))
      .finally(() => setLoadingOrderItems(false));
  }, [selected]);

  function loadPending() {
    setLoading(true);
    setError(null);
    transactionApi
      .listPending(storeId)
      .then(setPending)
      .catch(err => setError(err instanceof Error ? err.message : 'Gagal memuat daftar pesanan.'))
      .finally(() => setLoading(false));
  }
  useEffect(loadPending, [storeId]);

  // Jumping in directly from Order screen's "Lanjut Pembayaran" button —
  // look the transaction up in the pending list and open it right away.
  useEffect(() => {
    if (!autoSelectId) return;
    transactionApi.listPending(storeId).then(list => {
      const found = list.find(p => p.id === autoSelectId);
      if (found) setSelected(found);
      onConsumeAutoSelect?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectId]);

  async function handleCancelOrder(transactionId: string, invoiceNo: string) {
    const ok = await confirm({
      title: 'Batalkan Pesanan',
      message: `Batalkan pesanan ${invoiceNo}?`,
      confirmLabel: 'Ya, Batalkan',
      destructive: true,
    });
    if (ok) {
      transactionApi.void(transactionId).then(loadPending);
    }
  }

  function handleDone() {
    setSelected(null);
    setPaid(false);
    setPaidInfo(null);
    loadPending();
  }

  if (paid && selected) {
    return (
      <View style={shared.container}>
        <ScrollView contentContainerStyle={styles.receiptScreen}>
          <ReceiptView
            merchantName={user?.merchantName || 'Toko'}
            storeName={user?.storeName || ''}
            storeAddress={user?.storeAddress || user?.merchantAddress || ''}
            invoiceNo={selected.invoiceNo}
            cashierName={user?.name ?? 'Kasir'}
            items={(orderDetail?.items ?? []).map(i => ({ name: i.name, qty: i.qty, price: i.unitPrice }))}
            subtotal={orderDetail?.subtotal}
            discount={orderDetail?.discount}
            promoName={orderDetail?.promoName}
            total={selected.total}
            paid
            method={paidInfo?.method ?? '-'}
            amountReceived={paidInfo?.amountReceived}
            change={
              paidInfo?.amountReceived !== undefined
                ? paidInfo.amountReceived - selected.total
                : undefined
            }
            meta={paidInfo?.meta}
            paidAt={new Date().toLocaleString('id-ID')}
          />
          <TouchableOpacity style={[shared.primaryButton, styles.receiptDoneButton]} onPress={handleDone}>
            <Text style={shared.primaryButtonText}>Selesai</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (selected) {
    return (
      <View style={shared.container}>
        <ScrollView contentContainerStyle={styles.detailScreen}>
          <View style={styles.pageCard}>
            <Text style={styles.invoiceLabel}>{selected.invoiceNo}</Text>
            <Text style={styles.orderDetailTitle}>Detail Pesanan</Text>
            {loadingOrderItems ? (
              <ActivityIndicator color={colors.register} />
            ) : (
              <>
                {(orderDetail?.items ?? []).map((item, i) => (
                  <View key={i} style={styles.orderDetailRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailName}>{item.name}</Text>
                      <Text style={styles.orderDetailQty}>
                        {item.qty} x {formatRupiah(item.unitPrice)}
                      </Text>
                    </View>
                    <Text style={styles.orderDetailSubtotal}>
                      {formatRupiah(item.qty * item.unitPrice)}
                    </Text>
                  </View>
                ))}
                {!!orderDetail?.discount && orderDetail.discount > 0 && (
                  <View style={styles.promoRow}>
                    <Text style={styles.promoRowText} numberOfLines={1}>
                      🏷️ {orderDetail.promoName}
                    </Text>
                    <Text style={styles.promoRowValue}>
                      -{formatRupiah(orderDetail.discount)}
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.sectionDivider} />

            <PaymentMethodSelector
              transactionId={selected.id}
              total={selected.total}
              onBack={() => setSelected(null)}
              onPaid={info => {
                setPaid(true);
                setPaidInfo(info);
              }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={shared.container}>
      <AppHeader title="Pembayaran" subtitle="Pesanan yang menunggu dibayar" />

      {error && <Text style={[shared.errorText, { marginHorizontal: 16 }]}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.register} />
      ) : pending.length === 0 ? (
        <View style={shared.emptyBox}>
          <Text style={shared.emptyTitle}>Tidak ada pesanan menunggu</Text>
          <Text style={shared.emptySubtitle}>
            Pesanan baru dibuat lewat menu Order akan muncul di sini.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.swipeHint}>← Geser kartu ke kiri untuk membatalkan pesanan</Text>
          {pending.map(p => (
            <SwipeableRow key={p.id} onCancel={() => handleCancelOrder(p.id, p.invoiceNo)}>
              <TouchableOpacity style={styles.card} onPress={() => setSelected(p)}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.invoiceLabel}>{p.invoiceNo}</Text>
                  {p.minutesOpen >= 10 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{p.minutesOpen} menit</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardTotal}>{formatRupiah(p.total)}</Text>
                <Text style={styles.cardMeta}>
                  {p.itemCount} item · {p.cashierName}
                </Text>
              </TouchableOpacity>
            </SwipeableRow>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 10,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  detailScreen: {
    padding: 16,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  swipeHint: {
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'right',
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1B181A',
    padding: 14,
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
  badge: {
    backgroundColor: `${colors.alert}1A`,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.alert,
  },
  cardTotal: {
    fontSize: 20,
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
  receiptDoneButton: {
    width: 280,
    marginTop: 20,
  },
  pageCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1B181A',
    padding: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#1C1B181A',
    marginVertical: 16,
  },
  orderDetailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 10,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDetailName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  orderDetailQty: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  orderDetailSubtotal: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '600',
  },
  promoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1C1B181A',
    paddingTop: 8,
    marginTop: 4,
    gap: 8,
  },
  promoRowText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.teal,
  },
  promoRowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
  },
});
