import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { Radio, Wine, Coffee, Footprints, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { theme } from "../../constants/theme";
import { AvatarStack } from "./AvatarStack";
import { STATUS_LABELS, type StatusBroadcast, type StatusType } from "../../types";

const STATUS_ICONS: Partial<Record<StatusType, React.ElementType>> = {
  up_for_drinks: Wine,
  grabbing_coffee: Coffee,
  walk: Footprints,
  open: Sparkles,
};

interface BroadcastCardProps {
  broadcast: StatusBroadcast;
}

export function BroadcastCard({ broadcast }: BroadcastCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      ...theme.spring.gentle,
    }).start();
  }, []);

  const label =
    broadcast.status_type === "custom"
      ? broadcast.custom_text ?? "Available"
      : STATUS_LABELS[broadcast.status_type];

  const remaining = Math.max(
    0,
    Math.round(
      (new Date(broadcast.expires_at).getTime() - Date.now()) / 60000
    )
  );
  const timeLeft =
    remaining < 60
      ? `${remaining} min left`
      : `${Math.floor(remaining / 60)}h ${remaining % 60}m left`;

  const ContextIcon = STATUS_ICONS[broadcast.status_type];

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [
          { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          { scale },
        ],
      }}
    >
      <Pressable
        style={styles.container}
        onPressIn={() => {
          Haptics.selectionAsync();
          Animated.spring(scale, { toValue: 0.98, ...theme.spring.snappy }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, { toValue: 1, ...theme.spring.bouncy }).start();
        }}
      >
        <View style={styles.header}>
          {broadcast.profile && (
            <AvatarStack profiles={[broadcast.profile]} size={32} />
          )}
          <View style={styles.liveBadge}>
            <Radio size={12} color={theme.accent} strokeWidth={2} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          {ContextIcon && (
            <ContextIcon size={16} color={theme.text} strokeWidth={1.75} />
          )}
          <Text style={styles.status}>{label}</Text>
        </View>
        <Text style={styles.timeLeft}>{timeLeft}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.accentTint,
    borderWidth: 1,
    borderColor: theme.accentFill,
    borderRadius: theme.radius.lg,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  liveText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: theme.accent,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  status: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 16,
    color: theme.text,
  },
  timeLeft: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
  },
});
