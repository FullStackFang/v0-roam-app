import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  LayoutChangeEvent,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import type { TimeFilter } from "../../types";

interface TimeToggleProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
}

export function TimeToggle({ value, onChange }: TimeToggleProps) {
  const insets = useSafeAreaInsets();
  const slideX = useRef(new Animated.Value(0)).current;
  const [btnWidth, setBtnWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    // Each button takes half the inner width minus the gap
    setBtnWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    const toValue = value === "tonight" ? 0 : btnWidth + 2;
    Animated.spring(slideX, {
      toValue,
      ...theme.spring.snappy,
    }).start();
  }, [value, btnWidth]);

  return (
    <View style={[styles.container, { top: insets.top + TOP_BAR_HEIGHT + 8 }]}>
      {/* Sliding indicator */}
      {btnWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            { width: btnWidth, transform: [{ translateX: slideX }] },
          ]}
        />
      )}

      <Pressable
        style={styles.btn}
        onLayout={handleLayout}
        onPress={() => onChange("tonight")}
      >
        <Text
          style={[styles.btnText, value === "tonight" && styles.btnTextActive]}
        >
          TONIGHT
        </Text>
      </Pressable>
      <Pressable
        style={styles.btn}
        onPress={() => onChange("weekend")}
      >
        <Text
          style={[styles.btnText, value === "weekend" && styles.btnTextActive]}
        >
          THIS WEEKEND
        </Text>
      </Pressable>
    </View>
  );
}

const TOP_BAR_HEIGHT = 44;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 20,
    backgroundColor: theme.surfaceGlass,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.xl,
    padding: 4,
    flexDirection: "row",
    gap: 2,
    // Frosted glass shadow
    shadowColor: "#1A1B1E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  indicator: {
    position: "absolute",
    top: 4,
    left: 4,
    height: "100%",
    backgroundColor: theme.accent,
    borderRadius: theme.radius.lg,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: theme.radius.lg,
  },
  btnText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: theme.muted,
  },
  btnTextActive: {
    color: "#fff",
  },
});
