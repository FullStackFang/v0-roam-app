import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Radio } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { AvatarStack } from "./AvatarStack";
import type { StatusBroadcast } from "../../types";

const statusLabels: Record<string, string> = {
  out_now: "Out now",
  up_for_drinks: "Up for drinks",
  up_for_dinner: "Up for dinner",
  grabbing_coffee: "Grabbing coffee",
  custom: "",
};

interface BroadcastCardProps {
  broadcast: StatusBroadcast;
}

export function BroadcastCard({ broadcast }: BroadcastCardProps) {
  const label =
    broadcast.status_type === "custom"
      ? broadcast.custom_text ?? "Available"
      : statusLabels[broadcast.status_type];

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {broadcast.profile && (
          <AvatarStack profiles={[broadcast.profile]} size={32} />
        )}
        <View style={styles.liveBadge}>
          <Radio size={10} color={theme.accent} strokeWidth={2} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      <Text style={styles.status}>{label}</Text>
      <Text style={styles.timeLeft}>{timeLeft}</Text>
    </View>
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
    backgroundColor: "rgba(240,77,44,0.06)",
    borderWidth: 1,
    borderColor: "rgba(240,77,44,0.15)",
    borderRadius: theme.radius.lg,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  liveText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: theme.accent,
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
