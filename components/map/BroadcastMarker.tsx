import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { theme } from "../../constants/theme";
import type { StatusType } from "../../types";

/* ── Status → emoji + color mapping ──────────────────────────── */

const STATUS_MARKER: Record<
  StatusType,
  { emoji: string; bg: string; glow: string }
> = {
  up_for_drinks: { emoji: "🍷", bg: "#FF4D30", glow: "rgba(255,77,48,0.45)" },
  up_for_dinner: { emoji: "🍽️", bg: "#FFAA33", glow: "rgba(255,170,51,0.45)" },
  grabbing_coffee: {
    emoji: "☕",
    bg: "#F59E0B",
    glow: "rgba(245,158,11,0.45)",
  },
  walk: { emoji: "🚶", bg: "#06B6D4", glow: "rgba(6,182,212,0.40)" },
  open: { emoji: "✨", bg: "#10B981", glow: "rgba(16,185,129,0.40)" },
  out_now: { emoji: "🔥", bg: "#FF5733", glow: "rgba(255,87,51,0.45)" },
  custom: { emoji: "💬", bg: "#FF5733", glow: "rgba(255,87,51,0.40)" },
};

/** Moment marker — visually distinct "something's forming" */
export const MOMENT_MARKER = {
  emoji: "🔥",
  bg: "#FF6B3D",
  glow: "rgba(255,107,61,0.50)",
};

/* ── Hash helper for per-marker phase offset ─────────────────── */

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* ── Flicker constants ───────────────────────────────────────── */

const FLICKER_DURATION = 2400; // ms per full cycle
const FLICKER_MIN_OPACITY = 0.15;
const FLICKER_MAX_OPACITY = 0.55;
const FLICKER_MIN_SCALE = 0.85;
const FLICKER_MAX_SCALE = 1.2;

/* ── Component ───────────────────────────────────────────────── */

interface BroadcastMarkerProps {
  id: string;
  statusType: StatusType;
  isMoment?: boolean;
  isSelected?: boolean;
  onPress: () => void;
}

export function BroadcastMarker({
  id,
  statusType,
  isMoment = false,
  isSelected = false,
  onPress,
}: BroadcastMarkerProps) {
  const marker = isMoment ? MOMENT_MARKER : STATUS_MARKER[statusType];
  const phaseOffset = hashId(id) % 1000;

  /* ── Flicker animation (bonfire glow) ──────────────────────── */
  const glowOpacity = useSharedValue(FLICKER_MIN_OPACITY);
  const glowScale = useSharedValue(FLICKER_MIN_SCALE);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Stagger start based on marker ID so they don't flicker in sync
    const stagger = (phaseOffset / 1000) * FLICKER_DURATION;

    // Irregular flicker: asymmetric timing (fast rise, slow fall) like real fire
    const flickerUp = withTiming(FLICKER_MAX_OPACITY, {
      duration: FLICKER_DURATION * 0.35,
      easing: Easing.out(Easing.quad),
    });
    const flickerDown = withTiming(FLICKER_MIN_OPACITY, {
      duration: FLICKER_DURATION * 0.65,
      easing: Easing.inOut(Easing.sin),
    });

    const scaleUp = withTiming(FLICKER_MAX_SCALE, {
      duration: FLICKER_DURATION * 0.35,
      easing: Easing.out(Easing.quad),
    });
    const scaleDown = withTiming(FLICKER_MIN_SCALE, {
      duration: FLICKER_DURATION * 0.65,
      easing: Easing.inOut(Easing.sin),
    });

    // Delay by stagger then repeat forever
    glowOpacity.value = withTiming(FLICKER_MIN_OPACITY, { duration: stagger }, () => {
      glowOpacity.value = withRepeat(withSequence(flickerUp, flickerDown), -1);
    });
    glowScale.value = withTiming(FLICKER_MIN_SCALE, { duration: stagger }, () => {
      glowScale.value = withRepeat(withSequence(scaleUp, scaleDown), -1);
    });
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const markerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  /* ── Sizing ────────────────────────────────────────────────── */
  const size = isMoment ? 48 : 40;
  const glowSize = size * 2;
  const emojiSize = isMoment ? 22 : 18;

  return (
    <Animated.View style={[styles.root, markerAnimatedStyle]}>
      {/* Glow ring — bonfire flicker */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: marker.glow,
          },
        ]}
      />

      {/* Icon bubble */}
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withSpring(0.88, theme.spring.snappy);
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, theme.spring.bouncy);
        }}
        hitSlop={12}
      >
        <View
          style={[
            styles.bubble,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: marker.bg,
              borderWidth: isSelected ? 3 : 2.5,
              borderColor: isSelected ? theme.surface : "rgba(255,255,255,0.9)",
              boxShadow: isSelected
                ? `0px 0px 0px 2.5px ${marker.bg}, ${theme.shadow.fab}`
                : theme.shadow.pill,
            } as any,
          ]}
        >
          <Text style={[styles.emoji, { fontSize: emojiSize }]}>{marker.emoji}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
  },
  bubble: {
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  } as any,
  emoji: {
    textAlign: "center",
    lineHeight: 28,
  },
});
