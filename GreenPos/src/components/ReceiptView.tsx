import { Image, StyleSheet, Text, View } from 'react-native';
import { formatRupiah } from '../format';
import { colors } from '../theme';
import { PaymentMeta } from '../types';

const MARK = require('../assets/logo-mark.png');

export type ReceiptItem = { name: string; qty: number; price: number };

type Props = {
  merchantName: string;
  storeName: string;
  storeAddress: string;
  invoiceNo: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal?: number;
  discount?: number;
  promoName?: string;
  total: number;
  paid: boolean;
  method?: string;
  amountReceived?: number;
  change?: number;
  meta?: PaymentMeta;
  paidAt: string;
};

export function ReceiptView({
  merchantName,
  storeName,
  storeAddress,
  invoiceNo,
  cashierName,
  items,
  subtotal,
  discount,
  promoName,
  total,
  paid,
  method,
  amountReceived,
  change,
  meta,
  paidAt,
}: Props) {
  return (
    <View style={styles.receipt}>
      <Image source={MARK} style={styles.watermark} resizeMode="contain" />
      <View style={styles.header}>
        <Text style={styles.merchantName}>{merchantName}</Text>
        {!!storeName && storeName !== merchantName && (
          <Text style={styles.soft}>{storeName}</Text>
        )}
        <Text style={styles.soft}>{storeAddress}</Text>
      </View>

      <View
        style={[
          styles.statusBadge,
          { backgroundColor: paid ? `${colors.teal}1F` : `${colors.alert}1F` },
        ]}>
        <Text style={[styles.statusBadgeText, { color: paid ? colors.teal : colors.alert }]}>
          {paid ? 'LUNAS' : 'BELUM DIBAYAR'}
        </Text>
      </View>

      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.mono}>No: {invoiceNo}</Text>
        <Text style={styles.mono}>{paidAt}</Text>
      </View>
      <Text style={styles.mono}>Kasir: {cashierName}</Text>
      <View style={styles.divider} />
      {items.map((item, i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          <Text style={styles.mono}>{item.name}</Text>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>
              {item.qty} x {item.price.toLocaleString('id-ID')}
            </Text>
            <Text style={[styles.mono, styles.soft]}>
              {(item.qty * item.price).toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      ))}
      {!!discount && discount > 0 && (
        <>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>Subtotal</Text>
            <Text style={[styles.mono, styles.soft]}>{formatRupiah(subtotal ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.promoText]}>
              Diskon{promoName ? ` (${promoName})` : ''}
            </Text>
            <Text style={[styles.mono, styles.promoText]}>-{formatRupiah(discount)}</Text>
          </View>
        </>
      )}
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={[styles.mono, styles.bold]}>TOTAL</Text>
        <Text style={[styles.mono, styles.bold]}>{formatRupiah(total)}</Text>
      </View>
      {paid && !!method && (
        <View style={styles.row}>
          <Text style={[styles.mono, styles.soft]}>Metode</Text>
          <Text style={[styles.mono, styles.soft]}>{method.toUpperCase()}</Text>
        </View>
      )}
      {paid && amountReceived !== undefined && (
        <View style={styles.row}>
          <Text style={[styles.mono, styles.soft]}>Tunai</Text>
          <Text style={[styles.mono, styles.soft]}>
            {formatRupiah(amountReceived)}
          </Text>
        </View>
      )}
      {paid && change !== undefined && (
        <View style={styles.row}>
          <Text style={[styles.mono, styles.soft]}>Kembali</Text>
          <Text style={[styles.mono, styles.soft]}>{formatRupiah(change)}</Text>
        </View>
      )}
      {paid && !!meta?.cardType && (
        <>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>Kartu</Text>
            <Text style={[styles.mono, styles.soft]}>
              {meta.cardType} {meta.bankName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>No. Kartu</Text>
            <Text style={[styles.mono, styles.soft]}>**** **** **** {meta.cardLast4}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>Kode Approval</Text>
            <Text style={[styles.mono, styles.soft]}>{meta.approvalCode}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>Terminal ID</Text>
            <Text style={[styles.mono, styles.soft]}>{meta.terminalId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>No. Referensi</Text>
            <Text style={[styles.mono, styles.soft]}>{meta.referenceNo}</Text>
          </View>
        </>
      )}
      {paid && !!meta?.qrisAcquirer && (
        <>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>Penyelenggara</Text>
            <Text style={[styles.mono, styles.soft]}>{meta.qrisAcquirer}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>NMID</Text>
            <Text style={[styles.mono, styles.soft]}>{meta.qrisMerchantId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.mono, styles.soft]}>No. Referensi</Text>
            <Text style={[styles.mono, styles.soft]}>{meta.referenceNo}</Text>
          </View>
        </>
      )}
      <View style={styles.divider} />
      <Text style={[styles.soft, { textAlign: 'center' }]}>
        {paid
          ? 'Terima kasih atas kunjungan Anda'
          : 'Tunjukkan slip ini saat pesanan diantar'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  receipt: {
    width: 280,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 20,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    marginTop: -100,
    marginLeft: -100,
    opacity: 0.06,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  soft: {
    color: colors.inkSoft,
    fontSize: 11,
  },
  mono: {
    fontSize: 11,
    color: colors.ink,
  },
  bold: {
    fontWeight: '700',
  },
  promoText: {
    color: colors.teal,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#1C1B184D',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  statusBadge: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
