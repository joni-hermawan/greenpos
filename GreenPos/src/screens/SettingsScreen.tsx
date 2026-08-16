import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { shared } from '../sharedStyles';
import { colors } from '../theme';
import { EdcSetupScreen } from './EdcSetupScreen';

// Extensible settings hub — currently only has "Pengaturan EDC", but more
// entries (printer, receipt template, etc.) can be added to SETTINGS_MENU
// later without changing the navigation pattern.
type SectionId = 'edc';

const SETTINGS_MENU: { id: SectionId; icon: string; title: string; subtitle: string }[] = [
  {
    id: 'edc',
    icon: '💳',
    title: 'Pengaturan EDC',
    subtitle: 'Atur koneksi mesin EDC di perangkat ini',
  },
];

export function SettingsScreen() {
  const [section, setSection] = useState<SectionId | null>(null);

  const activeMeta = SETTINGS_MENU.find(m => m.id === section);

  return (
    <View style={shared.container}>
      <AppHeader
        title={activeMeta ? activeMeta.title : 'Pengaturan'}
        subtitle={activeMeta ? activeMeta.subtitle : 'Pengaturan aplikasi dan perangkat'}
      />

      {section === 'edc' ? (
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => setSection(null)} style={styles.backLinkWrap}>
            <Text style={shared.backLink}>← Kembali ke Pengaturan</Text>
          </TouchableOpacity>
          <EdcSetupScreen />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.menu}>
          {SETTINGS_MENU.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => setSection(item.id)}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    padding: 16,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1B181A',
    padding: 14,
    marginBottom: 10,
  },
  menuIcon: {
    fontSize: 22,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: colors.inkSoft,
  },
  backLinkWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
