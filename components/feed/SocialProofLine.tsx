import React from "react";
import { Text, StyleSheet } from "react-native";
import { theme } from "../../constants/theme";
import type { BroadcastJoin } from "../../types";

interface SocialProofLineProps {
  joins: BroadcastJoin[];
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export function SocialProofLine({ joins }: SocialProofLineProps) {
  if (joins.length === 0) return null;

  // Most recent join
  const latest = joins.reduce((a, b) =>
    new Date(b.created_at).getTime() > new Date(a.created_at).getTime() ? b : a
  );

  const name = latest.profile?.display_name?.split(" ")[0] ?? "Someone";

  return (
    <Text style={styles.text}>
      {name} joined{" "}
      <Text style={styles.dot}>&middot;</Text>{" "}
      {relativeTime(latest.created_at)}
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
