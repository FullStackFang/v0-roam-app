import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { X } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { STATUS_LABELS, type StatusBroadcast, type Moment, type StatusType } from "../../types";
import { formatTimeLeft } from "../../lib/formatTime";
import { JoinButton } from "../feed/JoinButton";
import { useJoinToggle } from "../../hooks/useJoinToggle";
import { AvatarStack } from "../feed/AvatarStack";
import type { Profile } from "../../types";

/* ── Status → emoji mapping (mirrors BroadcastMarker) ────────── */

const STATUS_EMOJI: Record<StatusType, string> = {
  up_for_drinks: "🍷",
  up_for_dinner: "🍽️",
  grabbing_coffee: "☕",
  walk: "🚶",
  open: "✨",
  out_now: "🔥",
  custom: "💬",
};

/* ── Helpers ──────────────────────────────────────────────────── */

function timeAgo(created: string): string {
  const ms = Date.now() - new Date(created).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ago`;
}

/* ── Card for a solo broadcast ───────────────────────────────── */

interface BroadcastDetailProps {
  broadcast: StatusBroadcast;
  currentUserId: string | null;
  onDismiss: () => void;
}

function BroadcastDetail({ broadcast, currentUserId, onDismiss }: BroadcastDetailProps) {
  const isMine = currentUserId === broadcast.user_id;
  const joins = broadcast.joins ?? [];
  const { hasJoined, joinLoading, handleJoinToggle } = useJoinToggle(
    broadcast.id,
    currentUserId,
    isMine,
    joins,
    broadcast.join_count ?? 0,
  );

  const label =
    broadcast.status_type === "custom"
      ? broadcast.custom_text ?? "Available"
      : STATUS_LABELS[broadcast.status_type];

  const emoji = STATUS_EMOJI[broadcast.status_type];
  const displayName = broadcast.profile?.display_name ?? "Someone";
  const timeLeft = formatTimeLeft(broadcast.expires_at);

  const profiles: Profile[] = [];
  if (broadcast.profile) profiles.push(broadcast.profile);

  return (
    <View style={styles.cardContent}>
      {/* Left: info */}
      <View style={styles.infoCol}>
        <View style={styles.topRow}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          <Pressable onPress={onDismiss} hitSlop={12} style={styles.closeBtn}>
            <X size={16} color={theme.muted} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={styles.metaRow}>
          <AvatarStack profiles={profiles} totalCount={profiles.length} size={22} />
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{timeLeft}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.ago}>{timeAgo(broadcast.created_at)}</Text>
          {!isMine && currentUserId && (
            <JoinButton
              joined={hasJoined}
              loading={joinLoading}
              onPress={handleJoinToggle}
            />
          )}
        </View>
      </View>

      {/* Right: large emoji circle */}
      <View style={styles.iconCol}>
        <View style={styles.bigIcon}>
          <Text style={styles.bigEmoji}>{emoji}</Text>
        </View>
      </View>
    </View>
  );
}

/* ── Card for a moment (cluster) ─────────────────────────────── */

interface MomentDetailProps {
  moment: Moment;
  currentUserId: string | null;
  onDismiss: () => void;
}

function MomentDetail({ moment, currentUserId, onDismiss }: MomentDetailProps) {
  const label = STATUS_LABELS[moment.status_type] || "Gathering";
  const emoji = STATUS_EMOJI[moment.status_type] || "🔥";
  const timeLeft = formatTimeLeft(moment.earliest_expiry);

  return (
    <View style={styles.cardContent}>
      <View style={styles.infoCol}>
        <View style={styles.topRow}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          <Pressable onPress={onDismiss} hitSlop={12} style={styles.closeBtn}>
            <X size={16} color={theme.muted} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={styles.metaRow}>
          <AvatarStack
            profiles={moment.all_profiles}
            totalCount={moment.participant_count}
            size={22}
          />
          <Text style={styles.name} numberOfLines={1}>
            {moment.participant_count} people
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.meta}>{timeLeft}</Text>
        </View>
      </View>
      <View style={styles.iconCol}>
        <View style={[styles.bigIcon, styles.momentIcon]}>
          <Text style={styles.bigEmoji}>{emoji}</Text>
        </View>
      </View>
    </View>
  );
}

/* ── Main wrapper ────────────────────────────────────────────── */

export type SelectedMapItem =
  | { type: "broadcast"; data: StatusBroadcast }
  | { type: "moment"; data: Moment };

interface MarkerDetailCardProps {
  item: SelectedMapItem;
  currentUserId: string | null;
  onDismiss: () => void;
}

export function MarkerDetailCard({ item, currentUserId, onDismiss }: MarkerDetailCardProps) {
  const scale = useSharedValue(1);
  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(22).stiffness(280).duration(400)}
      exiting={FadeOutUp.springify().damping(22).stiffness(280).duration(300)}
      style={[styles.card, animatedScale]}
    >
      {item.type === "broadcast" ? (
        <BroadcastDetail
          broadcast={item.data}
          currentUserId={currentUserId}
          onDismiss={onDismiss}
        />
      ) : (
        <MomentDetail
          moment={item.data}
          currentUserId={currentUserId}
          onDismiss={onDismiss}
        />
      )}
    </Animated.View>
  );
}

/* ── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    padding: 16,
    boxShadow: theme.shadow.card,
  } as any,
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  infoCol: {
    flex: 1,
    gap: 6,
  },
  iconCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 17,
    color: theme.text,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
    color: theme.text,
    flexShrink: 1,
  },
  dot: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
  },
  meta: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
    fontVariant: ["tabular-nums"],
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ago: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
  },
  bigIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.accentFill,
    alignItems: "center",
    justifyContent: "center",
  },
  momentIcon: {
    backgroundColor: theme.warmTint,
  },
  bigEmoji: {
    fontSize: 26,
    textAlign: "center",
  },
});
