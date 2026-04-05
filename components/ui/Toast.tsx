import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

type ToastVariant = "info" | "success" | "error";

interface ToastProps {
  message: string | null;
  variant?: ToastVariant;
  onHide: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string }> = {
  info: { bg: "rgba(255,255,255,0.96)", border: theme.border },
  success: { bg: "rgba(59,170,130,0.08)", border: "rgba(59,170,130,0.20)" },
  error: { bg: theme.errorTint, border: "rgba(217,48,37,0.20)" },
};

export function Toast({ message, variant = "info", onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, ...theme.spring.gentle }),
        Animated.spring(translateY, { toValue: 0, ...theme.spring.gentle }),
        Animated.spring(scale, { toValue: 1, ...theme.spring.gentle }),
      ]).start();

      const duration = variant === "error" ? 3500 : 2600;

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.spring(opacity, { toValue: 0, ...theme.spring.snappy }),
          Animated.spring(translateY, { toValue: -8, ...theme.spring.snappy }),
          Animated.spring(scale, { toValue: 0.95, ...theme.spring.snappy }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  const v = VARIANT_STYLES[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 60,
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    zIndex: theme.z.toast,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#1A1B1E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  text: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
    color: theme.text,
  },
});
