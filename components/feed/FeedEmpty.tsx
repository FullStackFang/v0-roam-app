import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Users } from "lucide-react-native";
import { theme } from "../../constants/theme";

export function FeedEmpty() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Users size={28} color={theme.muted} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>No one's out yet</Text>
      <Text style={styles.subtitle}>
        Be the first — tap "I'm out" to go live
      </Text>
    </View>
  );
}

export function FeedError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Couldn't load feed</Text>
      <Text style={[styles.subtitle, { marginBottom: 16 }]}>
        Check your connection and try again
      </Text>
      <Text style={styles.retry} onPress={onRetry}>
        Try again
      </Text>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonPill} />
          </View>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: "40%" }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 16,
    color: theme.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    color: theme.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  retry: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 14,
    color: theme.accent,
  },
  skeletonList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 10,
  },
  skeletonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  skeletonPill: {
    width: 48,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  skeletonLine: {
    width: "60%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
});
