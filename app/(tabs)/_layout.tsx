import React from "react";
import { Platform, View, Text, Pressable, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, List, Flame, Plane, MessageCircle } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { emitFirePress, emitCityPickerToggle } from "../../lib/events";
import { theme } from "../../constants/theme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 16 : 0);

  return (
    <View style={styles.outerWrapper}>
      {/* Fire button — absolutely positioned above the tab bar so its full
          touch area is outside the tab bar's hit-test bounds */}
      <View
        style={[styles.fireColumn, { bottom: bottomPad + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.fireButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (state.index !== 0) {
              navigation.navigate(state.routes[0].name);
            }
            emitFirePress();
          }}
        >
          <Flame size={30} color={theme.warmWhite} strokeWidth={2} />
        </Pressable>
        <Text style={styles.fireLabel}>You're out!</Text>
      </View>

      {/* Tab bar row */}
      <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
        {/* Left zone: Map + City switcher share the left half */}
        <View style={styles.leftZone}>
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
              size={24}
              color={state.index === 0 ? theme.accent : theme.muted}
              strokeWidth={state.index === 0 ? 2.25 : 2}
              fill={state.index === 0 ? theme.accent : "none"}
            />
            <Text style={[styles.tabLabel, state.index === 0 && styles.tabLabelActive]}>
              Map
            </Text>
          </Pressable>

          <Pressable
            style={styles.tab}
            onPress={() => {
              Haptics.selectionAsync();
              if (state.index !== 0) {
                navigation.navigate(state.routes[0].name);
              }
              emitCityPickerToggle();
            }}
            hitSlop={8}
          >
            <Plane size={20} color={theme.muted} strokeWidth={2} />
            <Text style={styles.tabLabel}>Explore</Text>
          </Pressable>
        </View>

        {/* Spacer where fire button visually sits */}
        <View style={styles.fireSpacer} />

        {/* Right zone: Feed + Chat share the right half */}
        <View style={styles.rightZone}>
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
              size={24}
              color={state.index === 1 ? theme.accent : theme.muted}
              strokeWidth={state.index === 1 ? 2.25 : 2}
            />
            <Text style={[styles.tabLabel, state.index === 1 && styles.tabLabelActive]}>
              Feed
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, styles.chatTab]}
            onPress={() => Haptics.selectionAsync()}
            hitSlop={8}
          >
            <MessageCircle size={20} color={theme.muted} strokeWidth={2} />
            <Text style={styles.tabLabel}>Chat</Text>
          </Pressable>
        </View>
      </View>
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

const FIRE_SIZE = 68;

const styles = StyleSheet.create({
  outerWrapper: {
    overflow: "visible",
  },

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

  leftZone: {
    flex: 1,
    flexDirection: "row",
  },
  rightZone: {
    flex: 1,
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 2,
  },
  chatTab: {
    opacity: 0.45,
  },
  tabLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    color: theme.muted,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: theme.accent,
    fontFamily: theme.fonts.sansSemiBold,
  },

  fireColumn: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    gap: 4,
  },
  fireSpacer: {
    width: FIRE_SIZE + 8,
  },
  fireButton: {
    width: FIRE_SIZE,
    height: FIRE_SIZE,
    borderRadius: FIRE_SIZE / 2,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: theme.surfaceElevated,
    boxShadow: theme.shadow.fab,
  } as any,
  fireLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    color: theme.muted,
    letterSpacing: 0.3,
  },
});
