import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Flame } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";

interface FireButtonProps {
  isLive: boolean;
  carouselOpen: boolean;
  onPress: () => void;
}

export function FireButton({ isLive, carouselOpen, onPress }: FireButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isLive || carouselOpen) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={animatedStyle}>
        <Pressable
          style={styles.button}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          }}
          onPressIn={() => {
            scale.value = withSpring(0.92, theme.spring.snappy);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, theme.spring.bouncy);
          }}
          hitSlop={16}
        >
          <Flame size={32} color={theme.warmWhite} strokeWidth={2} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: theme.z.fab,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: theme.shadow.fab,
  } as any,
});
