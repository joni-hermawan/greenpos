import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DEMO_ACCOUNTS } from '../api';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme';

const MARK = require('../assets/logo-mark.png');

const FEATURES = [
  { icon: '⚡', text: 'Order dibuat dalam hitungan detik' },
  { icon: '💳', text: 'Cash, QRIS, dan EDC dalam satu alur' },
  { icon: '📊', text: 'Riwayat & status pembayaran real-time' },
];

export function LoginScreen() {
  const { login, loginError } = useAuth();
  const { isTablet } = useResponsive();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [fade, translateY]);

  async function handleSubmit() {
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  }

  function fillDemoAccount(acc: (typeof DEMO_ACCOUNTS)[number]) {
    setUsername(acc.username);
    setPassword(acc.password);
  }

  const formCard = (
    <Animated.View
      style={[styles.formCard, { opacity: fade, transform: [{ translateY }] }]}>
      {!isTablet && (
        <View style={styles.brand}>
          <Logo size={40} />
        </View>
      )}
      <Text style={styles.title}>Masuk</Text>
      <Text style={styles.subtitle}>
        Gunakan akun yang diberikan administrator toko.
      </Text>

      {loginError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loginError}</Text>
        </View>
      )}

      <Text style={styles.label}>Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="kasir01"
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocusedField('username')}
        onBlur={() => setFocusedField(f => (f === 'username' ? null : f))}
        style={[styles.input, focusedField === 'username' && styles.inputFocused]}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        autoCapitalize="none"
        onFocus={() => setFocusedField('password')}
        onBlur={() => setFocusedField(f => (f === 'password' ? null : f))}
        style={[styles.input, focusedField === 'password' && styles.inputFocused]}
      />

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>Masuk</Text>
        )}
      </TouchableOpacity>

      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>
          Mode Demo — ketuk salah satu untuk isi otomatis:
        </Text>
        <View style={styles.demoGrid}>
          {DEMO_ACCOUNTS.map(acc => (
            <TouchableOpacity
              key={acc.username}
              style={styles.demoCard}
              onPress={() => fillDemoAccount(acc)}>
              <Text style={styles.demoLabel}>{acc.label}</Text>
              <Text style={styles.demoUsername}>{acc.username}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.demoNote}>
          Data dummy, reset otomatis setiap aplikasi dibuka ulang.
        </Text>
      </View>
    </Animated.View>
  );

  if (isTablet) {
    return (
      <View style={styles.splitRoot}>
        <View style={styles.brandPanel}>
          <Image source={MARK} style={styles.brandPanelWatermark} resizeMode="contain" />
          <Logo size={44} variant="light" />
          <Text style={styles.brandPanelHeadline}>SMART · FLEXIBLE · EFFICIENT</Text>
          <View style={styles.featureList}>
            {FEATURES.map(f => (
              <View key={f.text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>
        <ScrollView
          style={styles.formPanel}
          contentContainerStyle={styles.formPanelContent}
          keyboardShouldPersistTaps="handled">
          {formCard}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      {formCard}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.paper,
  },
  splitRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.paper,
  },
  brandPanel: {
    flex: 1,
    backgroundColor: colors.register,
    padding: 40,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandPanelWatermark: {
    position: 'absolute',
    width: 480,
    height: 480,
    right: -140,
    bottom: -120,
    opacity: 0.08,
  },
  brandPanelHeadline: {
    color: colors.leafLight,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: 20,
  },
  featureList: {
    marginTop: 36,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  formPanel: {
    flex: 1,
  },
  formPanelContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  brand: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: `${colors.alert}1A`,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.alert,
    fontSize: 13,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1C1B1826',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  inputFocused: {
    borderColor: colors.leaf,
    borderWidth: 1.5,
  },
  submitButton: {
    backgroundColor: colors.leaf,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  demoBox: {
    marginTop: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.leaf}66`,
    backgroundColor: `${colors.leaf}0D`,
    borderRadius: 8,
    padding: 12,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  demoCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: `${colors.leaf}4D`,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  demoUsername: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  demoNote: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 8,
  },
});
