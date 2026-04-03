import React, { useRef, useCallback } from "react";
import { Pressable, Animated, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { theme } from "../../constants/theme";

interface StatusFABProps {
  onPress: () => void;
}

export function StatusFAB({ onPress }: StatusFABProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.9,
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
        style={styles.btn}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 20,
    zIndex: 25,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
