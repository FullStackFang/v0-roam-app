import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";

interface StatusFABProps {
  onPress: () => void;
  isLive: boolean;
}

export function StatusFAB({ onPress, isLive }: StatusFABProps) {
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

  return (
    <Animated.View style={[styles.container, animatedScale]}>
      <Pressable
        style={[styles.btn, isLive && styles.btnLive]}
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
    height: 54,
    paddingHorizontal: 30,
    borderRadius: 27,
    borderCurve: "continuous",
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: theme.shadow.fab,
  } as any,
  btnLive: {
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.accentBorder,
    boxShadow: theme.shadow.pill,
  } as any,
  label: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 16,
    color: "#FFFCFA",
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
