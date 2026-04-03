import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import type { City } from "../../constants/cities";

export const TOP_BAR_HEIGHT = 44;

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
  const insets = useSafeAreaInsets();
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isOpen ? 1 : 0,
      damping: isOpen ? 22 : 20,
      stiffness: isOpen ? 180 : 280,
      useNativeDriver: false, // height interpolation can't use native driver
    }).start();
  }, [isOpen]);

  const handlePressIn = useCallback(() => {
    Animated.spring(pillScale, {
      toValue: 0.93,
      ...theme.spring.snappy,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(pillScale, {
      toValue: 1,
      ...theme.spring.bouncy,
    }).start();
  }, []);

  // Collapsed = just the label row height + padding. Expanded = all rows.
  const closedHeight = ROW_HEIGHT + PILL_PADDING;
  const openHeight = ROW_HEIGHT * cities.length + PILL_PADDING + 4;

  const animatedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [closedHeight, openHeight],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.logo}>
        ro<Text style={styles.logoAccent}>a</Text>m
      </Text>

      <View style={styles.pillAnchor}>
        {/* Dismiss overlay — catches taps outside the dropdown */}
        {isOpen && (
          <Pressable
            style={styles.dismissOverlay}
            onPress={onToggle}
          />
        )}

        <Animated.View style={{ transform: [{ scale: pillScale }] }}>
          <Animated.View
            style={[
              styles.cityPill,
              { height: animatedHeight },
              isOpen && styles.cityPillOpen,
            ]}
          >
            {/* Active city row / toggle trigger */}
            <Pressable
              style={styles.cityRow}
              onPress={onToggle}
              onPressIn={!isOpen ? handlePressIn : undefined}
              onPressOut={!isOpen ? handlePressOut : undefined}
            >
              <View style={styles.liveDot} />
              <Text style={styles.cityText}>{activeCity.label}</Text>
              <Animated.View
                style={{
                  marginLeft: 4,
                  transform: [
                    {
                      rotate: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <Text style={styles.chevron}>{">"}</Text>
              </Animated.View>
            </Pressable>

            {/* Dropdown rows */}
            {cities
              .filter((c) => c.key !== activeCity.key)
              .map((city, i) => {
                const total = cities.length - 1;
                // Stagger: each row fades in at a different point in the 0→1 range
                const start = 0.2 + (i / total) * 0.3;
                const end = Math.min(start + 0.4, 1);
                const rowOpacity = expandAnim.interpolate({
                  inputRange: [0, start, end],
                  outputRange: [0, 0, 1],
                  extrapolate: "clamp",
                });

                return (
                  <Animated.View key={city.key} style={{ opacity: rowOpacity }}>
                    <Pressable
                      style={styles.dropdownRow}
                      onPress={() => onSelect(city)}
                    >
                      <Text style={styles.dropdownText}>{city.label}</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: {
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    color: theme.text,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  logoAccent: {
    fontFamily: theme.fonts.serifItalic,
    color: theme.accent,
  },
  pillAnchor: {
    position: "relative",
  },
  dismissOverlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  cityPill: {
    backgroundColor: theme.surfaceGlass,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.lg,
    paddingVertical: PILL_PADDING / 2,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "rgba(255,255,255,0.6)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  cityPillOpen: {
    backgroundColor: "rgba(255,255,255,0.94)",
    shadowColor: "#1A1B1E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
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
  chevron: {
    fontFamily: theme.fonts.sans,
    fontSize: 9,
    color: theme.muted,
    transform: [{ rotate: "90deg" }],
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
