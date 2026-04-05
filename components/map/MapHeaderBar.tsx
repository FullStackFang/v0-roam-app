import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Users } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme, avatarColor } from "../../constants/theme";
import type { Profile } from "../../types";

interface MapHeaderBarProps {
  profile: Profile | null;
  onProfilePress?: () => void;
}

export function MapHeaderBar({ profile, onProfilePress }: MapHeaderBarProps) {
  const insets = useSafeAreaInsets();

  const initial = profile?.display_name?.charAt(0).toUpperCase() ?? "?";
  const bgColor = profile ? avatarColor(profile.id) : theme.muted;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      {/* Left: Profile avatar */}
      <Pressable
        style={styles.avatarBtn}
        onPress={() => {
          Haptics.selectionAsync();
          onProfilePress?.();
        }}
        hitSlop={8}
      >
        <View style={[styles.avatar, { backgroundColor: bgColor }]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      </Pressable>

      {/* Center: Logo */}
      <Text style={styles.logo}>bonfire</Text>

      {/* Right: Action icons */}
      <View style={styles.rightIcons}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => Haptics.selectionAsync()}
          hitSlop={4}
        >
          <Bell size={20} color={theme.muted} strokeWidth={1.75} />
        </Pressable>
        <Pressable
          style={styles.iconBtn}
          onPress={() => Haptics.selectionAsync()}
          hitSlop={4}
        >
          <Users size={20} color={theme.muted} strokeWidth={1.75} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    boxShadow: theme.shadow.header,
    zIndex: theme.z.header,
  } as any,
  avatarBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 14,
    color: "#FFFCFA",
    letterSpacing: 0.2,
  },
  logo: {
    fontFamily: theme.fonts.serifBold,
    fontSize: 24,
    color: theme.text,
    letterSpacing: -0.5,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
