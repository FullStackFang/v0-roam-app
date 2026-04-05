import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  FadeInDown,
  FadeOutDown,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";

interface BroadcastTriggerProps {
  isLive: boolean;
  onTriggerPress: () => void;
  onLivePress: () => void;
  visible: boolean;
}

export function BroadcastTrigger({
  isLive,
  onTriggerPress,
  onLivePress,
  visible,
}: BroadcastTriggerProps) {
  const triggerScale = useSharedValue(1);
  const liveScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const liveDotOpacity = useSharedValue(1);

  // Pulsing white dot on the "I'm out" trigger
  useEffect(() => {
    if (!visible) return;
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 700 }),
        withTiming(1, { duration: 700 })
      ),
      -1,
      true
    );
    return () => cancelAnimation(pulseOpacity);
  }, [visible]);

  // Pulsing green dot on live pill
  useEffect(() => {
    if (isLive) {
      liveDotOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    }
    return () => cancelAnimation(liveDotOpacity);
  }, [isLive]);

  const triggerScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
  }));

  const liveScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: liveScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const liveDotStyle = useAnimatedStyle(() => ({
    opacity: liveDotOpacity.value,
  }));

  if (!visible) return null;

  return (
    <>
      {/* Centered "I'm out" trigger — shown when NOT live */}
      {!isLive && (
        <Animated.View
          entering={FadeInDown.springify().damping(22).stiffness(180)}
          exiting={FadeOutDown.duration(150)}
          style={styles.triggerContainer}
          pointerEvents="box-none"
        >
          <Animated.View style={triggerScaleStyle}>
            <Pressable
              style={styles.triggerPill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onTriggerPress();
              }}
              onPressIn={() => {
                triggerScale.value = withSpring(0.94, theme.spring.snappy);
              }}
              onPressOut={() => {
                triggerScale.value = withSpring(1, theme.spring.bouncy);
              }}
            >
              <Animated.View style={[styles.triggerDot, pulseStyle]} />
              <Text style={styles.triggerLabel}>I'm out</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}

      {/* Bottom-right "Live" pill — shown when broadcasting */}
      {isLive && (
        <Animated.View
          entering={FadeIn.springify().damping(20)}
          exiting={FadeOut.duration(150)}
          style={styles.liveContainer}
        >
          <Animated.View style={liveScaleStyle}>
            <Pressable
              style={styles.livePill}
              onPress={onLivePress}
              onPressIn={() => {
                liveScale.value = withSpring(0.92, theme.spring.snappy);
              }}
              onPressOut={() => {
                liveScale.value = withSpring(1, theme.spring.bouncy);
              }}
            >
              <Animated.View style={[styles.liveDot, liveDotStyle]} />
              <Text style={styles.liveText}>Live</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  /* ── "I'm out" trigger (centered) ─────────────────────── */
  triggerContainer: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: theme.z.fab,
  },
  triggerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 52,
    paddingHorizontal: 28,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    backgroundColor: theme.accent,
    boxShadow: theme.shadow.fab,
  } as any,
  triggerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.warmWhite,
  },
  triggerLabel: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 17,
    color: theme.warmWhite,
    letterSpacing: 0.2,
  },

  /* ── Live pill (bottom-right) ─────────────────────────── */
  liveContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: theme.z.fab,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.accentBorder,
    boxShadow: theme.shadow.pill,
  } as any,
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
