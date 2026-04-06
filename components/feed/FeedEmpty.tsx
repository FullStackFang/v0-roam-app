import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Users } from "lucide-react-native";
import { theme } from "../../constants/theme";

export function FeedEmpty() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Users size={28} color={theme.accent} strokeWidth={1.5} />
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
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function ShimmerBlock({ style }: { style: any }) {
  const opacity = useSharedValue(0.04);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.09, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(26,27,30,${opacity.value})`,
  }));

  return <Animated.View style={[style, animatedStyle]} />;
}

export function FeedSkeleton() {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.skeletonList}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <ShimmerBlock style={styles.skeletonCircle} />
            <ShimmerBlock style={styles.skeletonPill} />
          </View>
          <ShimmerBlock style={styles.skeletonLine} />
          <ShimmerBlock style={[styles.skeletonLine, { width: "40%" }]} />
        </View>
      ))}
    </Animated.View>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    borderCurve: "continuous",
    backgroundColor: theme.accentTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  } as any,
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    backgroundColor: theme.accentTint,
  } as any,
  retryText: {
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
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    padding: 18,
    gap: 10,
    boxShadow: theme.shadow.card,
  } as any,
  skeletonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  skeletonPill: {
    width: 48,
    height: 20,
    borderRadius: 10,
  },
  skeletonLine: {
    width: "60%",
    height: 14,
    borderRadius: 7,
  },
});
