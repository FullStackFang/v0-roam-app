import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import Animated from "react-native-reanimated";
import { Check, Navigation } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { usePressScale } from "../../hooks/usePressScale";
import { theme } from "../../constants/theme";

type JoinButtonState = "default" | "on_my_way" | "joined";

interface JoinButtonProps {
  state: JoinButtonState;
  loading: boolean;
  onPress: () => void;
}

export function JoinButton({ state, loading, onPress }: JoinButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.92);

  const isActive = state !== "default";

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.button, isActive ? styles.active : styles.default]}
        onPress={onPress}
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressIn();
        }}
        onPressOut={onPressOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size={14} color={isActive ? theme.accent : theme.warmWhite} />
        ) : state === "joined" ? (
          <>
            <Check size={14} color={theme.accent} strokeWidth={2.5} />
            <Text style={styles.activeText}>Joined</Text>
          </>
        ) : state === "on_my_way" ? (
          <>
            <Navigation size={13} color={theme.accent} strokeWidth={2.5} />
            <Text style={styles.activeText}>OMW</Text>
          </>
        ) : (
          <Text style={styles.defaultText}>On my way</Text>
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
    paddingHorizontal: 22,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    gap: 4,
  } as any,
  default: {
    backgroundColor: theme.accent,
    boxShadow: theme.shadow.joinBtn,
  } as any,
  active: {
    backgroundColor: theme.accentFill,
    borderWidth: 1.5,
    borderColor: theme.accentBorder,
  },
  defaultText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 14,
    color: theme.warmWhite,
  },
  activeText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 14,
    color: theme.accent,
  },
});
