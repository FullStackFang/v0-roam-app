import React from "react";
import { Platform, View, Text, Pressable, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, List, Flame } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { emitFirePress } from "../../lib/events";
import { theme } from "../../constants/theme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 16 : 0);

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
      {/* Map tab */}
      <Pressable
        style={styles.tab}
        onPress={() => {
          Haptics.selectionAsync();
          const event = navigation.emit({ type: "tabPress", target: state.routes[0].key, canPreventDefault: true });
          if (!event.defaultPrevented) {
            navigation.navigate(state.routes[0].name);
          }
        }}
      >
        <MapPin
          size={22}
          color={state.index === 0 ? theme.accent : theme.muted}
          strokeWidth={state.index === 0 ? 2.25 : 1.5}
          fill={state.index === 0 ? theme.accent : "none"}
        />
        <Text style={[styles.tabLabel, state.index === 0 && styles.tabLabelActive]}>
          Map
        </Text>
      </Pressable>

      {/* Center fire button — raised above the tab bar */}
      <View style={styles.fireColumn}>
        <Pressable
          style={styles.fireButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Navigate to map tab first if not already there
            if (state.index !== 0) {
              navigation.navigate(state.routes[0].name);
            }
            emitFirePress();
          }}
        >
          <Flame size={28} color="#1A1B1E" strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.fireLabel}>You're out!</Text>
      </View>

      {/* Feed tab */}
      <Pressable
        style={styles.tab}
        onPress={() => {
          Haptics.selectionAsync();
          const event = navigation.emit({ type: "tabPress", target: state.routes[1].key, canPreventDefault: true });
          if (!event.defaultPrevented) {
            navigation.navigate(state.routes[1].name);
          }
        }}
      >
        <List
          size={22}
          color={state.index === 1 ? theme.accent : theme.muted}
          strokeWidth={state.index === 1 ? 2.25 : 1.5}
        />
        <Text style={[styles.tabLabel, state.index === 1 && styles.tabLabelActive]}>
          Feed
        </Text>
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="map" />
      <Tabs.Screen name="feed" />
    </Tabs>
  );
}

const FIRE_SIZE = 60;

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    backgroundColor: theme.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 8,
    boxShadow: theme.shadow.tab,
  } as any,

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 10,
    color: theme.muted,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: theme.accent,
    fontFamily: theme.fonts.sansSemiBold,
  },

  fireColumn: {
    alignItems: "center",
    marginTop: -(FIRE_SIZE / 2 + 4),
    gap: 4,
  },
  fireButton: {
    width: FIRE_SIZE,
    height: FIRE_SIZE,
    borderRadius: FIRE_SIZE / 2,
    backgroundColor: theme.green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: theme.surfaceElevated,
    boxShadow: "0px 2px 8px rgba(56,160,122,0.30), 0px 4px 16px rgba(56,160,122,0.15)",
  } as any,
  fireLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 10,
    color: theme.muted,
    letterSpacing: 0.3,
  },
});
