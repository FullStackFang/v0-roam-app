import React, { useRef, useCallback } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { theme } from "../../constants/theme";

interface StatusFABProps {
  onPress: () => void;
  isLive: boolean;
}

export function StatusFAB({ onPress, isLive }: StatusFABProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scale, {
      toValue: 0.92,
      ...theme.spring.snappy,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      ...theme.spring.bouncy,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Pressable
        style={[styles.btn, isLive && styles.btnLive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {isLive ? (
          <View style={styles.liveInner}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        ) : (
          <Text style={styles.label}>I'm out</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    zIndex: theme.z.fab,
  },
  btn: {
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 26,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnLive: {
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.accentBorder,
    shadowColor: "#1A1B1E",
    shadowOpacity: 0.08,
  },
  label: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.2,
  },
  liveInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.green,
  },
  liveText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 14,
    color: theme.text,
  },
});
