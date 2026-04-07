import React, { useEffect, useRef } from "react";
import { Text, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, cancelAnimation } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

type ToastVariant = "info" | "success" | "error";

interface ToastProps {
  message: string | null;
  variant?: ToastVariant;
  onHide: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string }> = {
  info: { bg: "rgba(255,248,240,0.96)", border: theme.border },
  success: { bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)" },
  error: { bg: theme.errorTint, border: "rgba(239,68,68,0.25)" },
};

export function Toast({ message, variant = "info", onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);
  const scale = useSharedValue(0.95);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  useEffect(() => {
    if (message) {
      // Enter
      opacity.value = withSpring(1, theme.spring.gentle);
      translateY.value = withSpring(0, theme.spring.gentle);
      scale.value = withSpring(1, theme.spring.gentle);

      const duration = variant === "error" ? 3500 : 2600;

      timerRef.current = setTimeout(() => {
        // Exit, then call onHide when opacity spring finishes
        opacity.value = withSpring(0, theme.spring.snappy, (finished) => {
          if (finished) runOnJS(onHide)();
        });
        translateY.value = withSpring(-8, theme.spring.snappy);
        scale.value = withSpring(0.95, theme.spring.snappy);
      }, duration);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        cancelAnimation(opacity);
        cancelAnimation(translateY);
        cancelAnimation(scale);
      };
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
        },
        animatedStyle,
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
    borderCurve: "continuous",
    paddingVertical: 14,
    paddingHorizontal: 24,
    boxShadow: theme.shadow.toast,
  } as any,
  text: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 14,
    color: theme.text,
  },
});
