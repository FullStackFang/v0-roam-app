import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Radio, Wine, Coffee, Footprints, Sparkles, Users } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";
import { AvatarStack } from "./AvatarStack";
import { JoinButton } from "./JoinButton";
import { SocialProofLine } from "./SocialProofLine";
import { joinBroadcast, leaveBroadcast } from "../../lib/queries";
import { STATUS_LABELS, type StatusBroadcast, type StatusType, type Profile } from "../../types";

const STATUS_ICONS: Partial<Record<StatusType, React.ElementType>> = {
  up_for_drinks: Wine,
  grabbing_coffee: Coffee,
  walk: Footprints,
  open: Sparkles,
};

interface BroadcastCardProps {
  broadcast: StatusBroadcast;
  currentUserId: string | null;
}

export function BroadcastCard({ broadcast, currentUserId }: BroadcastCardProps) {
  const scale = useSharedValue(1);
  const [joinLoading, setJoinLoading] = useState(false);
  const [optimisticJoined, setOptimisticJoined] = useState<boolean | null>(null);

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isMine = currentUserId === broadcast.user_id;
  const joins = broadcast.joins ?? [];
  const joinCount = optimisticJoined !== null
    ? (broadcast.join_count ?? 0) + (optimisticJoined ? 1 : -1)
    : (broadcast.join_count ?? 0);
  const hasJoined = optimisticJoined ?? joins.some((j) => j.user_id === currentUserId);
  const isForming = joinCount > 0;

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

  const allProfiles: Profile[] = [];
  if (broadcast.profile) allProfiles.push(broadcast.profile);
  for (const j of joins) {
    if (j.profile && j.user_id !== broadcast.user_id) {
      allProfiles.push(j.profile);
    }
  }

  const handleJoinToggle = useCallback(async () => {
    if (!currentUserId || isMine) return;
    setJoinLoading(true);
    const willJoin = !hasJoined;
    setOptimisticJoined(willJoin);
    try {
      if (willJoin) {
        await joinBroadcast(broadcast.id);
      } else {
        await leaveBroadcast(broadcast.id);
      }
    } catch {
      setOptimisticJoined(null);
    } finally {
      setJoinLoading(false);
    }
  }, [currentUserId, isMine, hasJoined, broadcast.id]);

  useEffect(() => {
    setOptimisticJoined(null);
  }, [broadcast.joins?.length]);

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(20).stiffness(200).duration(350)}
      style={animatedScale}
    >
      <Pressable
        style={[styles.container, isForming && styles.containerForming]}
        onPressIn={() => {
          Haptics.selectionAsync();
          scale.value = withSpring(0.975, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }}
      >
        <View style={styles.header}>
          <AvatarStack
            profiles={allProfiles}
            totalCount={allProfiles.length}
            size={isForming ? 28 : 32}
          />
          <View style={[styles.badge, isForming ? styles.formingBadge : styles.liveBadge]}>
            {isForming ? (
              <>
                <Users size={11} color={theme.green} strokeWidth={2.25} />
                <Text style={[styles.badgeText, styles.formingText]}>FORMING</Text>
              </>
            ) : (
              <>
                <Radio size={11} color={theme.accent} strokeWidth={2.25} />
                <Text style={[styles.badgeText, styles.liveText]}>LIVE</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.statusRow}>
          {ContextIcon && (
            <ContextIcon size={16} color={theme.text} strokeWidth={1.75} />
          )}
          <Text style={styles.status}>
            {isForming ? `${label} forming` : label}
          </Text>
        </View>

        {isForming && joins.length > 0 && (
          <SocialProofLine joins={joins} />
        )}

        <View style={styles.footer}>
          <Text style={styles.timeLeft}>{timeLeft}</Text>
          {!isMine && currentUserId && (
            <JoinButton
              joined={hasJoined}
              loading={joinLoading}
              onPress={handleJoinToggle}
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    padding: 18,
    gap: 10,
    boxShadow: theme.shadow.card,
  } as any,
  containerForming: {
    borderLeftWidth: 3,
    borderLeftColor: theme.green,
    boxShadow: theme.shadow.cardForming,
  } as any,
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
  } as any,
  liveBadge: {
    backgroundColor: theme.accentTint,
    borderColor: theme.accentFill,
  },
  formingBadge: {
    backgroundColor: theme.greenTint,
    borderColor: theme.greenBorder,
  },
  badgeText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  liveText: {
    color: theme.accent,
  },
  formingText: {
    color: theme.green,
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeLeft: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
    fontVariant: ["tabular-nums"],
  },
});
