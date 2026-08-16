import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { transactionApi } from '../api';
import { formatRupiah } from '../format';
import { QRCodeView } from './QRCodeView';
import { colors } from '../theme';
import { PaymentMeta, PaymentMethod } from '../types';

type Props = {
  transactionId: string;
  total: number;
  onPaid: (info: { method: PaymentMethod; amountReceived?: number; meta?: PaymentMeta }) => void;
  onBack?: () => void;
};

const QRIS_POLL_INTERVAL_MS = 2000;

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

type Step = 'select' | 'cash' | 'qris' | 'edc' | 'success' | 'failed';

export function PaymentMethodSelector({
  transactionId,
  total,
  onPaid,
  onBack,
}: Props) {
  const [step, setStep] = useState<Step>('select');
  const [amountReceived, setAmountReceived] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [qrString, setQrString] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Bumped on every new attempt/cancel so stale async responses from a
  // previous attempt (e.g. after the user hit "Batalkan") never apply.
  const attemptRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  const amountNumber = Number(amountReceived) || 0;
  const change = Math.max(0, amountNumber - total);

  function stopCountdown() {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }

  // Ticks the on-screen countdown every second from the charge's
  // expiresAt, independent of (but running alongside) the 2s status poll
  // below — if the QR expires before Midtrans reports it, we fail fast
  // instead of waiting for the next poll tick.
  function startCountdown(expiresAtIso: string, attempt: number) {
    const tick = () => {
      if (attempt !== attemptRef.current) return;
      const secondsLeft = Math.max(
        0,
        Math.round((new Date(expiresAtIso).getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(secondsLeft);
      if (secondsLeft <= 0) {
        stopCountdown();
        stopPolling();
        setWaiting(false);
        setStep('failed');
      }
    };
    tick();
    countdownTimer.current = setInterval(tick, 1000);
  }

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  async function runEDC(attempt: number) {
    setWaiting(true);
    try {
      const result = await transactionApi.payEDC(transactionId);
      if (attempt !== attemptRef.current) return;
      setWaiting(false);
      setStep('success');
      onPaid({ method: 'edc', meta: result.meta });
    } catch {
      if (attempt !== attemptRef.current) return;
      setWaiting(false);
      setStep('failed');
    }
  }

  async function runQRIS(attempt: number) {
    setWaiting(true);
    try {
      const charge = await transactionApi.qrisCharge(transactionId);
      if (attempt !== attemptRef.current) return;
      setQrString(charge.qrString);
      startCountdown(charge.expiresAt, attempt);

      pollTimer.current = setInterval(async () => {
        try {
          const status = await transactionApi.qrisStatus(transactionId);
          if (attempt !== attemptRef.current) return;
          if (status.status === 'settlement') {
            stopPolling();
            stopCountdown();
            setWaiting(false);
            setStep('success');
            onPaid({ method: 'qris', meta: status.meta });
          } else if (status.status === 'expire') {
            stopPolling();
            stopCountdown();
            setWaiting(false);
            setStep('failed');
          }
        } catch {
          // Transient network hiccup while polling — keep trying on the
          // next tick rather than failing the whole payment immediately.
        }
      }, QRIS_POLL_INTERVAL_MS);
    } catch {
      if (attempt !== attemptRef.current) return;
      setWaiting(false);
      setStep('failed');
    }
  }

  function chooseMethod(method: PaymentMethod) {
    if (method === 'cash') {
      setStep('cash');
      return;
    }
    const attempt = ++attemptRef.current;
    setQrString(null);
    setRemainingSeconds(null);
    setStep(method);
    if (method === 'edc') runEDC(attempt);
    if (method === 'qris') runQRIS(attempt);
  }

  async function confirmCash() {
    if (amountNumber < total) return;
    const result = await transactionApi.payCash(transactionId, amountNumber);
    setStep('success');
    onPaid({ method: 'cash', amountReceived: amountNumber, meta: result.meta });
  }

  function handleCancel() {
    attemptRef.current += 1; // invalidate any in-flight EDC/QRIS response
    stopPolling();
    stopCountdown();
    setWaiting(false);
    setQrString(null);
    setRemainingSeconds(null);
    setStep('select');
  }

  if (step === 'select') {
    return (
      <View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
        </View>
        <Text style={styles.sectionLabel}>Pilih metode pembayaran</Text>
        <View style={styles.methodRow}>
          <MethodButton label="Cash" onPress={() => chooseMethod('cash')} />
          <MethodButton label="QRIS" onPress={() => chooseMethod('qris')} />
          <MethodButton label="EDC" onPress={() => chooseMethod('edc')} />
        </View>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backLinkBottom}>
            <Text style={styles.backLink}>← Kembali ke keranjang</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (step === 'cash') {
    return (
      <View>
        <Text style={styles.sectionLabel}>Uang diterima</Text>
        <TextInput
          value={amountReceived}
          onChangeText={setAmountReceived}
          keyboardType="numeric"
          autoFocus
          placeholder="0"
          style={styles.cashInput}
        />
        <View style={styles.rowBetween}>
          <Text style={styles.soft}>Total tagihan</Text>
          <Text style={styles.mono}>{formatRupiah(total)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={[styles.soft, { fontWeight: '700' }]}>Kembalian</Text>
          <Text style={[styles.mono, { color: colors.teal, fontWeight: '700' }]}>
            {formatRupiah(change)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, amountNumber < total && styles.disabled]}
          disabled={amountNumber < total}
          onPress={confirmCash}>
          <Text style={styles.confirmButtonText}>Konfirmasi pembayaran</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setStep('select')} style={{ marginTop: 12 }}>
          <Text style={styles.cancelText}>Batal, pilih metode lain</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'qris') {
    return (
      <View style={styles.centerCol}>
        <Text style={styles.sectionLabel}>Scan QRIS untuk membayar</Text>
        <View style={styles.qrBox}>
          {qrString ? (
            <QRCodeView value={qrString} size={168} />
          ) : (
            <ActivityIndicator size="small" color={colors.inkSoft} />
          )}
        </View>
        <Text style={styles.mono}>{formatRupiah(total)}</Text>
        {remainingSeconds !== null && (
          <Text style={styles.qrExpiryText}>
            Kedaluwarsa dalam {formatCountdown(remainingSeconds)}
          </Text>
        )}
        {waiting && (
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color={colors.inkSoft} />
            <Text style={styles.soft}>Menunggu pembayaran…</Text>
          </View>
        )}
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Batalkan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'edc') {
    return (
      <View style={styles.centerCol}>
        <Text style={styles.sectionLabel}>Ikuti instruksi di mesin EDC</Text>
        <Text style={styles.mono}>{formatRupiah(total)}</Text>
        {waiting && (
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color={colors.teal} />
            <Text style={[styles.soft, { color: colors.teal }]}>
              Terhubung ke mesin EDC — menunggu kartu…
            </Text>
          </View>
        )}
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Batalkan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'success') {
    return (
      <View style={styles.centerCol}>
        <Text style={{ fontSize: 36, color: colors.teal }}>✓</Text>
        <Text style={styles.sectionLabel}>Pembayaran berhasil</Text>
      </View>
    );
  }

  return (
    <View style={styles.centerCol}>
      <Text style={{ fontSize: 36, color: colors.alert }}>✕</Text>
      <Text style={styles.sectionLabel}>Pembayaran gagal</Text>
      <TouchableOpacity onPress={() => setStep('select')}>
        <Text style={styles.cancelText}>Coba metode lain</Text>
      </TouchableOpacity>
    </View>
  );
}

function MethodButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.methodButton} onPress={onPress}>
      <Text style={styles.methodButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backLink: {
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 12,
  },
  backLinkBottom: {
    marginTop: 20,
    alignItems: 'center',
  },
  totalBox: {
    backgroundColor: colors.paperDim,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#1C1B181A',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
  },
  methodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.register,
  },
  cashInput: {
    borderWidth: 1,
    borderColor: '#1C1B1826',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    marginBottom: 12,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  soft: {
    color: colors.inkSoft,
    fontSize: 13,
  },
  mono: {
    fontSize: 16,
    color: colors.ink,
  },
  confirmButton: {
    backgroundColor: colors.register,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  cancelText: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  centerCol: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  qrBox: {
    width: 180,
    height: 180,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#1C1B1833',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: 10,
  },
  qrExpiryText: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: -4,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
