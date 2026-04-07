import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import Animated from "react-native-reanimated";
import { Check } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { usePressScale } from "../../hooks/usePressScale";
import { theme } from "../../constants/theme";

interface JoinButtonProps {
  joined: boolean;
  loading: boolean;
  onPress: () => void;
}

export function JoinButton({ joined, loading, onPress }: JoinButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.92);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.button, joined ? styles.joined : styles.default]}
        onPress={onPress}
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressIn();
        }}
        onPressOut={onPressOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size={14} color={joined ? theme.accent : theme.warmWhite} />
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
    paddingHorizontal: 22,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    gap: 4,
  } as any,
  default: {
    backgroundColor: theme.accent,
    boxShadow: theme.shadow.joinBtn,
  } as any,
  joined: {
    backgroundColor: theme.accentFill,
    borderWidth: 1.5,
    borderColor: theme.accentBorder,
  },
  defaultText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 14,
    color: theme.warmWhite,
  },
  joinedText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 14,
    color: theme.accent,
  },
});
