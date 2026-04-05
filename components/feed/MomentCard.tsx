import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Flame, ChevronDown, Wine, Coffee, Footprints, Sparkles } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";
import { AvatarStack } from "./AvatarStack";
import { JoinButton } from "./JoinButton";
import { joinBroadcast, leaveBroadcast } from "../../lib/queries";
import { STATUS_LABELS, type Moment, type StatusType, type StatusBroadcast } from "../../types";

const STATUS_ICONS: Partial<Record<StatusType, React.ElementType>> = {
  up_for_drinks: Wine,
  up_for_dinner: Wine,
  grabbing_coffee: Coffee,
  walk: Footprints,
  open: Sparkles,
};

interface MomentCardProps {
  moment: Moment;
  currentUserId: string | null;
}

export function MomentCard({ moment, currentUserId }: MomentCardProps) {
  const scale = useSharedValue(1);
  const [expanded, setExpanded] = useState(false);

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const label = STATUS_LABELS[moment.status_type];
  const ContextIcon = STATUS_ICONS[moment.status_type];

  const remaining = Math.max(
    0,
    Math.round((new Date(moment.earliest_expiry).getTime() - Date.now()) / 60000)
  );
  const timeLeft =
    remaining < 60
      ? `${remaining} min left`
      : `${Math.floor(remaining / 60)}h ${remaining % 60}m left`;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(20).stiffness(200).duration(350)}
      style={animatedScale}
    >
      <Pressable
        style={styles.container}
        onPress={() => {
          Haptics.selectionAsync();
          setExpanded(!expanded);
        }}
        onPressIn={() => {
          scale.value = withSpring(0.975, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <AvatarStack
            profiles={moment.all_profiles}
            totalCount={moment.participant_count}
            size={28}
          />
          <View style={styles.badge}>
            <Flame size={11} color={theme.warm} strokeWidth={2.25} />
            <Text style={styles.badgeText}>MOMENT</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          {ContextIcon && (
            <ContextIcon size={16} color={theme.text} strokeWidth={1.75} />
          )}
          <Text style={styles.status}>{label} forming</Text>
        </View>

        {/* Participant count */}
        <Text style={styles.participants}>
          {moment.participant_count} {moment.participant_count === 1 ? "person" : "people"}
        </Text>

        {/* Expanded broadcast list */}
        {expanded && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.broadcastList}>
            {moment.broadcasts.map((b) => (
              <MomentBroadcastRow
                key={b.id}
                broadcast={b}
                currentUserId={currentUserId}
              />
            ))}
          </Animated.View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.timeLeft}>{timeLeft}</Text>
          <View style={styles.expandHint}>
            <ChevronDown
              size={14}
              color={theme.muted}
              strokeWidth={1.5}
              style={expanded ? { transform: [{ rotate: "180deg" }] } : undefined}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function MomentBroadcastRow({
  broadcast,
  currentUserId,
}: {
  broadcast: StatusBroadcast;
  currentUserId: string | null;
}) {
  const [joinLoading, setJoinLoading] = useState(false);
  const [optimisticJoined, setOptimisticJoined] = useState<boolean | null>(null);

  const isMine = currentUserId === broadcast.user_id;
  const joins = broadcast.joins ?? [];
  const hasJoined = optimisticJoined ?? joins.some((j) => j.user_id === currentUserId);

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

  const name = broadcast.profile?.display_name?.split(" ")[0] ?? "Someone";
  const joinCount = (broadcast.join_count ?? 0) + (optimisticJoined === true ? 1 : optimisticJoined === false ? -1 : 0);

  return (
    <View style={styles.broadcastRow}>
      <View style={styles.broadcastRowLeft}>
        <View style={[styles.miniAvatar, { backgroundColor: theme.avatars[0] }]}>
          <Text style={styles.miniAvatarText}>
            {broadcast.profile?.display_name?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <View>
          <Text style={styles.broadcastName}>{name}</Text>
          {joinCount > 0 && (
            <Text style={styles.broadcastJoins}>+{joinCount} joined</Text>
          )}
        </View>
      </View>
      {!isMine && currentUserId && (
        <JoinButton
          joined={hasJoined}
          loading={joinLoading}
          onPress={handleJoinToggle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    borderLeftWidth: 3,
    borderLeftColor: theme.warm,
    padding: 18,
    gap: 10,
    boxShadow: theme.shadow.cardMoment,
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
    backgroundColor: theme.warmTint,
    borderColor: theme.warmBorder,
  } as any,
  badgeText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: theme.warm,
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
  participants: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
  },
  broadcastList: {
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  broadcastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  broadcastRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  } as any,
  miniAvatarText: {
    fontWeight: "600",
    fontSize: 11,
    color: "#fff",
  },
  broadcastName: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
    color: theme.text,
  },
  broadcastJoins: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    color: theme.muted,
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
  expandHint: {
    padding: 4,
  },
});
