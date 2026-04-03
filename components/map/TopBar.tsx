import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

export const TOP_BAR_HEIGHT = 44;

export function TopBar() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.logo}>
        ro<Text style={styles.logoAccent}>a</Text>m
      </Text>
      <View style={styles.cityPill}>
        <View style={styles.liveDot} />
        <Text style={styles.cityText}>CORNELL</Text>
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
    alignItems: "center",
  },
  logo: {
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    color: theme.text,
    letterSpacing: -0.5,
  },
  logoAccent: {
    fontFamily: theme.fonts.serifItalic,
    color: theme.accent,
  },
  cityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.surfaceGlass,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.lg,
    paddingVertical: 6,
    paddingHorizontal: 14,
    // Inner refraction edge
    shadowColor: "rgba(255,255,255,0.6)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
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
});
