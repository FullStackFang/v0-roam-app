import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Plus } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";

interface StatusFABProps {
  onPress: () => void;
  isLive: boolean;
  visible?: boolean;
}

export function StatusFAB({ onPress, isLive, visible = true }: StatusFABProps) {
  const scale = useSharedValue(1);
  const dotOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (isLive) {
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    }
  }, [isLive]);

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.92, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.springify().damping(20)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, animatedScale]}
    >
      <Pressable
        style={[styles.btn, isLive ? styles.btnLive : styles.btnPlus]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {isLive ? (
          <View style={styles.liveInner}>
            <Animated.View style={[styles.liveDot, dotStyle]} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        ) : (
          <Plus size={24} color="#FFFCFA" strokeWidth={2.5} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: theme.z.fab,
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  } as any,
  btnPlus: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    boxShadow: theme.shadow.fab,
  } as any,
  btnLive: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.accentBorder,
    boxShadow: theme.shadow.pill,
  } as any,
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
