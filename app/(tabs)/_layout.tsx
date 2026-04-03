import React from "react";
import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, List } from "lucide-react-native";
import { theme } from "../../constants/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Ensure tab bar clears the Android navigation bar
  const tabBarHeight = 52 + Math.max(insets.bottom, Platform.OS === "android" ? 16 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 16 : 0),
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: "rgba(26,27,30,0.20)",
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <MapPin
                size={22}
                color={color}
                strokeWidth={focused ? 2.25 : 1.5}
                fill={focused ? "rgba(240,77,44,0.12)" : "none"}
              />
              {focused && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.accent,
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <List
                size={22}
                color={color}
                strokeWidth={focused ? 2.25 : 1.5}
              />
              {focused && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.accent,
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
