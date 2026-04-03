import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
} from "react-native";
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
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isOpen ? 1 : 0,
      damping: isOpen ? 22 : 20,
      stiffness: isOpen ? 180 : 280,
      useNativeDriver: false,
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

  const closedHeight = ROW_HEIGHT + PILL_PADDING;
  const openHeight = ROW_HEIGHT * cities.length + PILL_PADDING + 4;

  const animatedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [closedHeight, openHeight],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Text style={styles.logo}>
        ro<Text style={styles.logoAccent}>a</Text>m
      </Text>

      {/* Pill sits in its own elevated stacking context */}
      <View style={[styles.pillAnchor, isOpen && styles.pillAnchorOpen]}>
        {/* Dismiss overlay — full-screen tap catcher when dropdown open */}
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

            {cities
              .filter((c) => c.key !== activeCity.key)
              .map((city, i) => {
                const total = cities.length - 1;
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 8,
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
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: "#1A1B1E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
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
