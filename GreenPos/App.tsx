/**
 * GREEN POS — Kasir (mobile)
 *
 * Ported from D:\DataSaya\NEW POS\nota-pos\demo-frontend (Login + the 4
 * kasir-role menus: Kasir/POS, Pembayaran, Riwayat Transaksi, Pengaturan
 * EDC). Mock in-memory API, no real backend connection.
 *
 * @format
 */

import { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Logo } from './src/components/Logo';
import { StoreGate } from './src/components/StoreGate';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ConfirmDialogProvider } from './src/context/ConfirmDialogContext';
import { useLogoutConfirm } from './src/hooks/useLogoutConfirm';
import { useResponsive } from './src/hooks/useResponsive';
import { LoginScreen } from './src/screens/LoginScreen';
import { PosScreen } from './src/screens/PosScreen';
import { PembayaranScreen } from './src/screens/PembayaranScreen';
import { RiwayatTransaksiScreen } from './src/screens/RiwayatTransaksiScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme';

type TabId = 'pos' | 'pembayaran' | 'riwayat' | 'settings';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'pos', label: 'Order', icon: '🛒' },
  { id: 'pembayaran', label: 'Pembayaran', icon: '💳' },
  { id: 'riwayat', label: 'Riwayat', icon: '🧾' },
  { id: 'settings', label: 'Pengaturan', icon: '⚙️' },
];

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <ConfirmDialogProvider>
          <RootScreen />
        </ConfirmDialogProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      {user ? <MainTabs /> : <LoginScreen />}
    </View>
  );
}

function MainTabs() {
  const [tab, setTab] = useState<TabId>('pos');
  const [autoSelectPaymentId, setAutoSelectPaymentId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isTablet } = useResponsive();
  const { user, logout } = useAuth();
  const handleLogout = useLogoutConfirm(logout);
  const initial = (user?.name ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <StoreGate>
      {storeId => (
        <View style={styles.container}>
          <View style={[styles.mainRow, isTablet && styles.mainRowTablet]}>
            {isTablet && (
              <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
                <View style={styles.sidebarBrand}>
                  {!sidebarCollapsed && <Logo size={40} variant="light" />}
                  <TouchableOpacity
                    style={styles.collapseButton}
                    onPress={() => setSidebarCollapsed(v => !v)}>
                    <Text style={styles.collapseButtonText}>
                      {sidebarCollapsed ? '›' : '‹'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {TABS.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.sidebarItem,
                      sidebarCollapsed && styles.sidebarItemCollapsed,
                      tab === t.id && styles.sidebarItemActive,
                    ]}
                    onPress={() => setTab(t.id)}>
                    <Text style={styles.sidebarIcon}>{t.icon}</Text>
                    {!sidebarCollapsed && (
                      <Text
                        style={[
                          styles.sidebarLabel,
                          tab === t.id && styles.sidebarLabelActive,
                        ]}>
                        {t.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}

                <View style={styles.sidebarSpacer} />

                <View style={styles.sidebarUserSection}>
                  <View
                    style={[
                      styles.sidebarUserRow,
                      sidebarCollapsed && styles.sidebarUserRowCollapsed,
                    ]}>
                    <View style={styles.sidebarAvatar}>
                      <Text style={styles.sidebarAvatarText}>{initial}</Text>
                    </View>
                    {!sidebarCollapsed && (
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sidebarUserName} numberOfLines={1}>
                          {user?.name ?? 'Pengguna'}
                        </Text>
                        <Text style={styles.sidebarUserRole} numberOfLines={1}>
                          {user?.role ?? ''}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.sidebarLogoutButton,
                      sidebarCollapsed && styles.sidebarItemCollapsed,
                    ]}
                    onPress={handleLogout}>
                    <Text style={styles.sidebarLogoutIcon}>🚪</Text>
                    {!sidebarCollapsed && (
                      <Text style={styles.sidebarLogoutText}>Keluar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <View style={styles.content}>
              {tab === 'pos' && (
                <PosScreen
                  storeId={storeId}
                  onGoToPayment={transactionId => {
                    setAutoSelectPaymentId(transactionId);
                    setTab('pembayaran');
                  }}
                />
              )}
              {tab === 'pembayaran' && (
                <PembayaranScreen
                  storeId={storeId}
                  autoSelectId={autoSelectPaymentId}
                  onConsumeAutoSelect={() => setAutoSelectPaymentId(null)}
                />
              )}
              {tab === 'riwayat' && <RiwayatTransaksiScreen storeId={storeId} />}
              {tab === 'settings' && <SettingsScreen />}
            </View>
          </View>
          {!isTablet && (
            <View style={styles.tabBar}>
              {TABS.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.tabButton}
                  onPress={() => setTab(t.id)}>
                  <Text style={styles.tabIcon}>{t.icon}</Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      tab === t.id && styles.tabLabelActive,
                    ]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </StoreGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  mainRow: {
    flex: 1,
  },
  mainRowTablet: {
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,
    backgroundColor: colors.register,
    paddingTop: 20,
    paddingHorizontal: 12,
  },
  sidebarCollapsed: {
    width: 72,
    paddingHorizontal: 10,
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  collapseButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: `${colors.paper}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseButtonText: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  sidebarItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 0,
  },
  sidebarItemActive: {
    backgroundColor: colors.registerLight,
  },
  sidebarIcon: {
    fontSize: 18,
    width: 22,
    textAlign: 'center',
  },
  sidebarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: `${colors.paper}B3`,
  },
  sidebarLabelActive: {
    color: colors.paper,
  },
  sidebarSpacer: {
    flex: 1,
  },
  sidebarUserSection: {
    borderTopWidth: 1,
    borderTopColor: `${colors.paper}26`,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  sidebarUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  sidebarUserRowCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  sidebarAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.leaf,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarAvatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  sidebarUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.paper,
  },
  sidebarUserRole: {
    fontSize: 11,
    color: `${colors.paper}99`,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  sidebarLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sidebarLogoutIcon: {
    fontSize: 15,
  },
  sidebarLogoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.alertLight,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1C1B181A',
    backgroundColor: colors.white,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.register,
    fontWeight: '700',
  },
});

export default App;
