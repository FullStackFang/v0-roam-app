import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";
import type { City } from "../../constants/cities";

interface CityPickerMenuProps {
  cities: City[];
  activeCity: City;
  onSelect: (city: City) => void;
  onDismiss: () => void;
}

export function CityPickerMenu({
  cities,
  activeCity,
  onSelect,
  onDismiss,
}: CityPickerMenuProps) {
  const handleSelect = useCallback(
    (city: City) => {
      Haptics.selectionAsync();
      onSelect(city);
    },
    [onSelect],
  );

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable style={styles.dismissOverlay} onPress={onDismiss} />

      <Animated.View
        style={styles.menu}
        entering={FadeInUp.springify().damping(22).stiffness(280)}
        exiting={FadeOutDown.springify().damping(18).stiffness(300)}
      >
        {cities.map((city) => {
          const isActive = city.key === activeCity.key;
          return (
            <Pressable
              key={city.key}
              style={[styles.menuRow, isActive && styles.menuRowActive]}
              onPress={() => handleSelect(city)}
            >
              <View style={[styles.dot, isActive && styles.dotActive]} />
              <Text
                style={[styles.menuText, isActive && styles.menuTextActive]}
              >
                {city.label}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: "flex-start",
    zIndex: theme.z.sheet,
  },
  dismissOverlay: {
    position: "absolute",
    top: -2000,
    left: -400,
    right: -400,
    bottom: -200,
    zIndex: -1,
  },
  menu: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingVertical: 6,
    paddingHorizontal: 4,
    boxShadow: "0px 4px 16px rgba(26,27,30,0.10), 0px 1px 4px rgba(26,27,30,0.06)",
  } as any,
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    gap: 8,
  },
  menuRowActive: {
    backgroundColor: "rgba(255,87,51,0.06)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.border,
  },
  dotActive: {
    backgroundColor: theme.accent,
  },
  menuText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    color: theme.muted,
  },
  menuTextActive: {
    fontFamily: theme.fonts.sansSemiBold,
    color: theme.accent,
  },
});
