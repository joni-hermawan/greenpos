import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Props = ConfirmOptions & {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Ya',
  cancelLabel = 'Batal',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.92);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 22,
          bounciness: 6,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Animated.View style={[styles.backdropFade, { opacity }]} />
        <Pressable style={styles.cardWrap} onPress={() => {}}>
          <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
            <Text style={styles.title}>{title}</Text>
            {!!message && <Text style={styles.message}>{message}</Text>}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                onPress={onCancel}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  destructive && styles.confirmButtonDestructive,
                  pressed && styles.pressed,
                ]}
                onPress={onConfirm}>
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdropFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0B1410B3',
  },
  cardWrap: {
    width: '100%',
    maxWidth: 380,
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  message: {
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 8,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 22,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  confirmButton: {
    backgroundColor: colors.leaf,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  confirmButtonDestructive: {
    backgroundColor: colors.alert,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.7,
  },
});
