import React from "react";
import { Text, StyleSheet } from "react-native";
import { theme } from "../../constants/theme";
import { formatTimeAgo } from "../../lib/formatTime";
import type { BroadcastJoin } from "../../types";

interface SocialProofLineProps {
  joins: BroadcastJoin[];
}

export function SocialProofLine({ joins }: SocialProofLineProps) {
  if (joins.length === 0) return null;

  // Most recent join
  const latest = joins.reduce((a, b) =>
    new Date(b.created_at).getTime() > new Date(a.created_at).getTime() ? b : a
  );

  const name = latest.profile?.display_name?.split(" ")[0] ?? "Someone";
  const verb = latest.join_type === "on_my_way" ? "is on the way" : "joined";

  return (
    <Text style={styles.text}>
      {name} {verb}{" "}
      <Text style={styles.dot}>&middot;</Text>{" "}
      {formatTimeAgo(latest.created_at)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
  },
  dot: {
    color: theme.muted,
  },
});
