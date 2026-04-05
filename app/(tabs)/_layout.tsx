import React from "react";
import { Platform, View, Pressable } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, List } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { theme } from "../../constants/theme";

function FocusDot() {
  return (
    <View
      style={{
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: theme.accent,
        marginTop: 4,
      }}
    />
  );
}

function HapticTab(props: any) {
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        Haptics.selectionAsync();
        props.onPress?.(e);
      }}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const tabBarHeight = 52 + Math.max(insets.bottom, Platform.OS === "android" ? 16 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
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
        tabBarInactiveTintColor: theme.muted,
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
                fill={focused ? theme.accent : "none"}
              />
              {focused && <FocusDot />}
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
              {focused && <FocusDot />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
