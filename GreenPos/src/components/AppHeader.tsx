import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLogoutConfirm } from '../hooks/useLogoutConfirm';
import { useResponsive } from '../hooks/useResponsive';
import { shared } from '../sharedStyles';
import { colors } from '../theme';
import { Logo } from './Logo';

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, logout } = useAuth();
  const handleLogout = useLogoutConfirm(logout);
  const { isTablet } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = (user?.name ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={shared.header}>
      <View style={styles.titleRow}>
        <Logo size={22} showText={false} />
        <View>
          <Text style={shared.headerTitle}>{title}</Text>
          {!!subtitle && <Text style={shared.headerSubtitle}>{subtitle}</Text>}
        </View>
      </View>

      {isTablet ? (
        // On tablet the account + Keluar live at the bottom of the sidebar
        // (see App.tsx), so the header's right side just shows the active
        // store for context.
        <View style={styles.storeChip}>
          {!!user?.merchantName && (
            <Text style={styles.merchantChipText} numberOfLines={1}>
              {user.merchantName}
            </Text>
          )}
          <Text style={styles.storeChipText} numberOfLines={1}>
            {user?.storeName || 'Semua store'}
          </Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.userChip}
            activeOpacity={0.7}
            onPress={() => setMenuOpen(true)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name ?? 'Pengguna'}
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>

          <Modal
            visible={menuOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuOpen(false)}>
            <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  activeOpacity={0.6}
                  onPress={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}>
                  <Text style={styles.dropdownItemIcon}>🚪</Text>
                  <Text style={styles.dropdownItemText}>Keluar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeChip: {
    maxWidth: 260,
    alignItems: 'flex-end',
  },
  merchantChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  storeChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.inkSoft,
    marginTop: 1,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 180,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.register,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    flexShrink: 1,
  },
  chevron: {
    fontSize: 10,
    color: colors.inkSoft,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    top: 84,
    right: 16,
    minWidth: 160,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1C1B1814',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemIcon: {
    fontSize: 15,
  },
  dropdownItemText: {
    color: colors.alert,
    fontWeight: '600',
    fontSize: 14,
  },
});
