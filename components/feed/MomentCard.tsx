import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { Flame, ChevronDown } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme, avatarColor } from "../../constants/theme";
import { usePressScale } from "../../hooks/usePressScale";
import { STATUS_ICONS } from "../../constants/statusIcons";
import { formatTimeLeft } from "../../lib/formatTime";
import { useJoinToggle } from "../../hooks/useJoinToggle";
import { AvatarStack } from "./AvatarStack";
import { JoinButton } from "./JoinButton";
import { STATUS_LABELS, type Moment, type StatusBroadcast } from "../../types";

interface MomentCardProps {
  moment: Moment;
  currentUserId: string | null;
}

export function MomentCard({ moment, currentUserId }: MomentCardProps) {
  const { animatedStyle: animatedScale, onPressIn, onPressOut } = usePressScale(0.975);
  const [expanded, setExpanded] = useState(false);

  const label = STATUS_LABELS[moment.status_type];
  const ContextIcon = STATUS_ICONS[moment.status_type];

  const timeLeft = formatTimeLeft(moment.earliest_expiry);

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
        onPressIn={onPressIn}
        onPressOut={onPressOut}
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
  const isMine = currentUserId === broadcast.user_id;
  const joins = broadcast.joins ?? [];
  const { joinCount, omwCount, joinButtonProps } = useJoinToggle(
    broadcast.id,
    currentUserId,
    isMine,
    joins,
    broadcast.join_count ?? 0
  );

  const name = broadcast.profile?.display_name?.split(" ")[0] ?? "Someone";

  return (
    <View style={styles.broadcastRow}>
      <View style={styles.broadcastRowLeft}>
        <View style={[styles.miniAvatar, { backgroundColor: avatarColor(broadcast.user_id) }]}>
          <Text style={styles.miniAvatarText}>
            {broadcast.profile?.display_name?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <View>
          <Text style={styles.broadcastName}>{name}</Text>
          {joinCount > 0 && (
            <Text style={styles.broadcastJoins}>
              +{joinCount}{omwCount > 0 ? ` (${omwCount} otw)` : " joined"}
            </Text>
          )}
        </View>
      </View>
      {!isMine && currentUserId && (
        <JoinButton {...joinButtonProps} />
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
    padding: 20,
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
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: theme.warmTint,
  } as any,
  badgeText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: theme.warm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  status: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 18,
    color: theme.text,
  },
  participants: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 14,
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
