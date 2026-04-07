import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
} from "react-native-reanimated";
import { X } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { STATUS_LABELS, type StatusBroadcast, type Moment, type Gather, type StatusType, type Profile } from "../../types";
import { formatTimeLeft, formatTimeAgo } from "../../lib/formatTime";
import { JoinButton } from "../feed/JoinButton";
import { useJoinToggle } from "../../hooks/useJoinToggle";
import { useGatherRSVP } from "../../hooks/useGatherRSVP";
import { AvatarStack } from "../feed/AvatarStack";
import { STATUS_EMOJI } from "../map/BroadcastMarker";
import { MapPin, Check } from "lucide-react-native";

/* ── Card for a solo broadcast ───────────────────────────────── */

interface BroadcastDetailProps {
  broadcast: StatusBroadcast;
  currentUserId: string | null;
  onDismiss: () => void;
}

function BroadcastDetail({ broadcast, currentUserId, onDismiss }: BroadcastDetailProps) {
  const isMine = currentUserId === broadcast.user_id;
  const joins = broadcast.joins ?? [];
  const { joinButtonProps } = useJoinToggle(
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
        {broadcast.custom_text && broadcast.status_type !== "custom" && (
          <Text style={styles.customText} numberOfLines={1}>{broadcast.custom_text}</Text>
        )}
        <View style={styles.metaRow}>
          <AvatarStack profiles={profiles} totalCount={profiles.length} size={22} />
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{timeLeft}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.ago}>{formatTimeAgo(broadcast.created_at)}</Text>
          {!isMine && currentUserId && (
            <JoinButton
              {...joinButtonProps}
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

/* ── Card for a gather ─────────────────────────────────────────── */

interface GatherDetailProps {
  gather: Gather;
  currentUserId: string | null;
  onDismiss: () => void;
}

function GatherDetail({ gather, currentUserId, onDismiss }: GatherDetailProps) {
  const invites = gather.invites ?? [];
  const isMine = currentUserId === gather.created_by;
  const { inCount, rsvpButtonProps } = useGatherRSVP(
    gather.id,
    currentUserId,
    isMine,
    invites,
    gather.in_count ?? 0,
  );

  const displayName = gather.profile?.display_name ?? "Someone";
  const timeLeft = formatTimeLeft(gather.expires_at);

  const inProfiles: Profile[] = invites
    .filter((i) => i.rsvp === "in" && i.profile)
    .map((i) => i.profile!);
  if (gather.profile && !inProfiles.find((p) => p.id === gather.created_by)) {
    inProfiles.unshift(gather.profile);
  }

  return (
    <View style={styles.cardContent}>
      <View style={styles.infoCol}>
        <View style={styles.topRow}>
          <Text style={styles.label} numberOfLines={1}>{gather.title}</Text>
          <Pressable onPress={onDismiss} hitSlop={12} style={styles.closeBtn}>
            <X size={16} color={theme.muted} strokeWidth={2} />
          </Pressable>
        </View>
        {gather.venue_name && (
          <View style={styles.metaRow}>
            <MapPin size={12} color={theme.muted} strokeWidth={1.75} />
            <Text style={styles.customText} numberOfLines={1}>{gather.venue_name}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <AvatarStack profiles={inProfiles} totalCount={inCount} size={22} />
          <Text style={styles.name} numberOfLines={1}>
            {inCount > 0 ? `${inCount} in` : displayName}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{timeLeft}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.ago}>{formatTimeAgo(gather.created_at)}</Text>
          {currentUserId && rsvpButtonProps.state !== "in" && (
            <Pressable
              style={styles.gatherInBtn}
              onPress={() => rsvpButtonProps.onIn()}
              disabled={rsvpButtonProps.loading}
            >
              <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.gatherInText}>I'm in</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.iconCol}>
        <View style={[styles.bigIcon, styles.gatherIcon]}>
          <Text style={styles.bigEmoji}>🤝</Text>
        </View>
      </View>
    </View>
  );
}

/* ── Main wrapper ────────────────────────────────────────────── */

export type SelectedMapItem =
  | { type: "broadcast"; data: StatusBroadcast }
  | { type: "moment"; data: Moment }
  | { type: "gather"; data: Gather };

interface MarkerDetailCardProps {
  item: SelectedMapItem;
  currentUserId: string | null;
  onDismiss: () => void;
}

export function MarkerDetailCard({ item, currentUserId, onDismiss }: MarkerDetailCardProps) {
  return (
    <Animated.View
      entering={FadeInUp.springify().damping(22).stiffness(280).duration(400)}
      exiting={FadeOutUp.springify().damping(22).stiffness(280).duration(300)}
      style={styles.card}
    >
      {item.type === "broadcast" ? (
        <BroadcastDetail
          broadcast={item.data}
          currentUserId={currentUserId}
          onDismiss={onDismiss}
        />
      ) : item.type === "moment" ? (
        <MomentDetail
          moment={item.data}
          currentUserId={currentUserId}
          onDismiss={onDismiss}
        />
      ) : (
        <GatherDetail
          gather={item.data}
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
  customText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
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
  gatherIcon: {
    backgroundColor: "rgba(245,158,11,0.20)",
  },
  bigEmoji: {
    fontSize: 26,
    textAlign: "center",
  },
  gatherInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    backgroundColor: theme.green,
  } as any,
  gatherInText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    color: "#FFFFFF",
  },
});
