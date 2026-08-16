import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { shared } from '../sharedStyles';
import { colors } from '../theme';

type DeviceId = 'bca' | 'pvs';

interface DeviceOption {
  id: DeviceId;
  name: string;
  model: string;
  swatchColor: string;
  port: string;
}

const DEVICES: DeviceOption[] = [
  { id: 'bca', name: 'EDC BCA', model: 'PAX A920 Pro', swatchColor: '#1554B0', port: 'COM3' },
  { id: 'pvs', name: 'EDC PVS', model: 'Verifone V240m', swatchColor: '#EA580C', port: 'COM5' },
];

// Simulated discovery success rate — real hardware search isn't guaranteed to
// find the terminal on the first try (not switched on, out of range, etc.).
const FIND_SUCCESS_RATE = 0.75;

type Step = 'select' | 'searching' | 'found' | 'notfound' | 'connecting' | 'connected';

export function EdcSetupScreen() {
  const [step, setStep] = useState<Step>('select');
  const [device, setDevice] = useState<DeviceOption | null>(null);
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState(false);

  function handleSearch(d: DeviceOption) {
    setDevice(d);
    setStep('searching');
    setTimeout(() => {
      setStep(Math.random() < FIND_SUCCESS_RATE ? 'found' : 'notfound');
    }, 1400);
  }

  function handleConnect() {
    setStep('connecting');
    setTimeout(() => setStep('connected'), 900);
  }

  function handleBackToSelect() {
    setStep('select');
    setDevice(null);
    setTestOk(false);
  }

  function handleDisconnect() {
    handleBackToSelect();
  }

  function handleTest() {
    setTesting(true);
    setTestOk(false);
    setTimeout(() => {
      setTesting(false);
      setTestOk(true);
    }, 700);
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      {step === 'select' || step === 'searching' ? (
        <>
          {DEVICES.map(d => {
            const isSearchingThis = step === 'searching' && device?.id === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={styles.deviceCard}
                disabled={step === 'searching'}
                onPress={() => handleSearch(d)}>
                <View style={[styles.swatch, { backgroundColor: d.swatchColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceName}>{d.name}</Text>
                  <Text style={styles.deviceModel}>{d.model}</Text>
                </View>
                {isSearchingThis && <ActivityIndicator size="small" color={colors.leaf} />}
              </TouchableOpacity>
            );
          })}
          {step === 'searching' && (
            <View style={styles.connectingRow}>
              <ActivityIndicator size="small" color={colors.inkSoft} />
              <Text style={styles.soft}>Mencari {device?.name}…</Text>
            </View>
          )}
        </>
      ) : step === 'notfound' ? (
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundTitle}>{device?.name} tidak ditemukan</Text>
          <Text style={styles.notFoundText}>
            Pastikan mesin EDC menyala dan berada dalam jangkauan, lalu coba lagi.
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[shared.primaryButton, { flex: 1 }]}
              onPress={() => device && handleSearch(device)}>
              <Text style={shared.primaryButtonText}>Cari Lagi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[shared.secondaryButton, { flex: 1 }]}
              onPress={handleBackToSelect}>
              <Text style={shared.secondaryButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : step === 'found' ? (
        <View style={styles.detailCard}>
          <Text style={styles.foundLabel}>✓ Ditemukan</Text>
          <View style={styles.detailRow}>
            <View style={[styles.swatch, { backgroundColor: device?.swatchColor }]} />
            <View>
              <Text style={styles.deviceName}>{device?.name}</Text>
              <Text style={styles.deviceModel}>
                {device?.model} · Port {device?.port}
              </Text>
            </View>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[shared.primaryButton, { flex: 1 }]} onPress={handleConnect}>
              <Text style={shared.primaryButtonText}>Hubungkan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[shared.secondaryButton, { flex: 1 }]}
              onPress={handleBackToSelect}>
              <Text style={shared.secondaryButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : step === 'connecting' ? (
        <View style={styles.connectingRow}>
          <ActivityIndicator size="small" color={colors.inkSoft} />
          <Text style={styles.soft}>Menghubungkan ke {device?.name}…</Text>
        </View>
      ) : (
        <>
          <View style={styles.connectedBanner}>
            <Text style={styles.connectedBannerText}>Terhubung ke {device?.name}</Text>
          </View>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={[styles.swatch, { backgroundColor: device?.swatchColor }]} />
              <View>
                <Text style={styles.deviceName}>{device?.name}</Text>
                <Text style={styles.deviceModel}>
                  {device?.model} · Port {device?.port}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[shared.secondaryButton, { flex: 1 }]}
                disabled={testing}
                onPress={handleTest}>
                {testing ? (
                  <ActivityIndicator size="small" color={colors.register} />
                ) : (
                  <Text style={shared.secondaryButtonText}>Tes Koneksi</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[shared.secondaryButton, { flex: 1 }]}
                onPress={handleDisconnect}>
                <Text style={shared.secondaryButtonText}>Ganti Mesin</Text>
              </TouchableOpacity>
            </View>

            {testOk && (
              <Text style={styles.testOkText}>✓ Berhasil terhubung ke {device?.name}</Text>
            )}
          </View>
          <Text style={styles.footerNote}>
            Pengaturan ini tersimpan di perangkat ini saja — kalau ganti perangkat
            kasir, perlu dipilih ulang di perangkat yang baru.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 16,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1B181A',
    padding: 14,
    marginBottom: 10,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  deviceModel: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  connectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  soft: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  notFoundBox: {
    backgroundColor: `${colors.alert}0D`,
    borderWidth: 1,
    borderColor: `${colors.alert}33`,
    borderRadius: 12,
    padding: 16,
  },
  notFoundTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.alert,
    marginBottom: 6,
  },
  notFoundText: {
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 14,
  },
  foundLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
    marginBottom: 10,
  },
  connectedBanner: {
    backgroundColor: `${colors.teal}1A`,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  connectedBannerText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1B181A',
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paperDim,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testOkText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.teal,
  },
  footerNote: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 16,
  },
});
