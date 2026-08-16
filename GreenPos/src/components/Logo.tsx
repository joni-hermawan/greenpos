import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// Official mark supplied by the user (GreenPos.jpg) — the neon-green
// infinity loop was extracted onto a transparent background (chroma-keyed
// out of its original dark-navy card) so it can be dropped at any size.
const MARK = require('../assets/logo-mark.png');

type Props = {
  size?: number;
  variant?: 'dark' | 'light';
  showText?: boolean;
};

export function Logo({ size = 32, variant = 'dark', showText = true }: Props) {
  const baseTextColor = variant === 'light' ? colors.paper : colors.ink;
  const accentTextColor = variant === 'light' ? colors.leafLight : colors.leaf;

  return (
    <View style={styles.row}>
      <Image source={MARK} style={{ width: size, height: size }} resizeMode="contain" />
      {showText && (
        <Text style={[styles.text, { fontSize: size * 0.42 }]}>
          <Text style={{ color: baseTextColor, fontWeight: '400' }}>green</Text>
          <Text> </Text>
          <Text style={{ color: accentTextColor, fontWeight: '800' }}>pos</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    letterSpacing: 0.3,
  },
});
