import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

const ACTION_WIDTH = 100;

// Hand-rolled swipe-to-reveal using PanResponder + Animated (both core RN
// APIs) instead of react-native-gesture-handler, to avoid adding a new
// native dependency (see other components in this file for the same
// constraint).
export function SwipeableRow({
  children,
  onCancel,
  actionLabel = 'Batalkan',
}: {
  children: React.ReactNode;
  onCancel: () => void;
  actionLabel?: string;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const dragStartX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        translateX.stopAnimation(value => {
          dragStartX.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(0, Math.max(-ACTION_WIDTH, dragStartX.current + gesture.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldOpen = gesture.dx < -ACTION_WIDTH / 2 || gesture.vx < -0.5;
        Animated.spring(translateX, {
          toValue: shouldOpen ? -ACTION_WIDTH : 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  function handlePress() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
    onCancel();
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.actionLayer}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePress} activeOpacity={0.8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  actionLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.alert,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
