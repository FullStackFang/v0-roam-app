import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "../../lib/haptics";
import { ChevronDown } from "lucide-react-native";
import { theme } from "../../constants/theme";
import type { City } from "../../constants/cities";

interface TopBarProps {
  cities: City[];
  activeCity: City;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (city: City) => void;
}

const ROW_HEIGHT = 38;
const PILL_PADDING = 8;

export function TopBar({
  cities,
  activeCity,
  isOpen,
  onToggle,
  onSelect,
}: TopBarProps) {
  const expandAnim = useSharedValue(0);
  const pillScale = useSharedValue(1);

  useEffect(() => {
    expandAnim.value = withSpring(isOpen ? 1 : 0, {
      damping: isOpen ? 22 : 20,
      stiffness: isOpen ? 180 : 280,
    });
  }, [isOpen]);

  const handlePressIn = useCallback(() => {
    pillScale.value = withSpring(0.93, theme.spring.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    pillScale.value = withSpring(1, theme.spring.bouncy);
  }, []);

  const closedHeight = ROW_HEIGHT + PILL_PADDING;
  const openHeight = ROW_HEIGHT * cities.length + PILL_PADDING + 4;

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
  }));

  const heightStyle = useAnimatedStyle(() => ({
    height: interpolate(expandAnim.value, [0, 1], [closedHeight, openHeight]),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    marginLeft: 2,
    transform: [{ rotate: `${interpolate(expandAnim.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Text style={styles.logo}>bonfire</Text>

      {/* Pill sits in its own elevated stacking context */}
      <View style={[styles.pillAnchor, isOpen && styles.pillAnchorOpen]}>
        {/* Dismiss overlay — full-screen tap catcher when dropdown open */}
        {isOpen && (
          <Pressable
            style={styles.dismissOverlay}
            onPress={onToggle}
          />
        )}

        <Animated.View style={scaleStyle}>
          <Animated.View
            style={[
              styles.cityPill,
              heightStyle,
              isOpen && styles.cityPillOpen,
            ]}
          >
            <Pressable
              style={styles.cityRow}
              onPress={onToggle}
              onPressIn={!isOpen ? handlePressIn : undefined}
              onPressOut={!isOpen ? handlePressOut : undefined}
            >
              <View style={styles.liveDot} />
              <Text style={styles.cityText}>{activeCity.label}</Text>
              <Animated.View style={chevronStyle}>
                <ChevronDown size={12} color={theme.muted} strokeWidth={2} />
              </Animated.View>
            </Pressable>

            {cities
              .filter((c) => c.key !== activeCity.key)
              .map((city, i) => (
                <DropdownRow
                  key={city.key}
                  city={city}
                  index={i}
                  total={cities.length - 1}
                  expandAnim={expandAnim}
                  onSelect={onSelect}
                />
              ))}
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

function DropdownRow({
  city,
  index,
  total,
  expandAnim,
  onSelect,
}: {
  city: City;
  index: number;
  total: number;
  expandAnim: SharedValue<number>;
  onSelect: (city: City) => void;
}) {
  const start = 0.2 + (index / total) * 0.3;
  const end = Math.min(start + 0.4, 1);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expandAnim.value,
      [0, start, end],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Animated.View style={rowStyle}>
      <Pressable
        style={styles.dropdownRow}
        onPress={() => {
          Haptics.selectionAsync();
          onSelect(city);
        }}
      >
        <Text style={styles.dropdownText}>{city.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logo: {
    fontFamily: theme.fonts.serifBold,
    fontSize: 28,
    color: theme.text,
    letterSpacing: -0.6,
    marginTop: 6,
  },
  pillAnchor: {
    position: "relative",
    zIndex: 1,
  },
  pillAnchorOpen: {
    zIndex: 100,
  },
  dismissOverlay: {
    position: "absolute",
    top: -200,
    left: -400,
    right: -400,
    bottom: -2000,
    zIndex: -1,
  },
  cityPill: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    paddingVertical: PILL_PADDING / 2,
    paddingHorizontal: 14,
    overflow: "hidden",
    boxShadow: theme.shadow.pill,
  } as any,
  cityPillOpen: {
    backgroundColor: "rgba(255,255,255,0.96)",
    boxShadow: "0px 4px 16px rgba(26,27,30,0.10), 0px 1px 4px rgba(26,27,30,0.06)",
  } as any,
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    height: ROW_HEIGHT,
    gap: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.accent,
  },
  cityText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: theme.muted,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: ROW_HEIGHT,
    paddingLeft: 11,
  },
  dropdownText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.0,
    color: theme.text,
  },
});
