import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Check } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";

interface JoinButtonProps {
  joined: boolean;
  loading: boolean;
  onPress: () => void;
}

export function JoinButton({ joined, loading, onPress }: JoinButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.92, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.button, joined ? styles.joined : styles.default]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size={14} color={joined ? theme.accent : "#FFFCFA"} />
        ) : joined ? (
          <>
            <Check size={14} color={theme.accent} strokeWidth={2.5} />
            <Text style={styles.joinedText}>Joined</Text>
          </>
        ) : (
          <Text style={styles.defaultText}>Join</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    paddingHorizontal: 18,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    gap: 4,
  } as any,
  default: {
    backgroundColor: theme.accent,
    boxShadow: theme.shadow.joinBtn,
  } as any,
  joined: {
    backgroundColor: theme.accentTint,
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  defaultText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 13,
    color: "#FFFCFA",
  },
  joinedText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 13,
    color: theme.accent,
  },
});
