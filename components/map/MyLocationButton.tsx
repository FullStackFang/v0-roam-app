import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Locate } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { usePressScale } from "../../hooks/usePressScale";
import { theme } from "../../constants/theme";

interface MyLocationButtonProps {
  onPress: () => void;
}

export function MyLocationButton({ onPress }: MyLocationButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.9);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={styles.fab}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Locate size={18} color={theme.muted} strokeWidth={1.75} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: theme.shadow.pill,
  } as any,
});
