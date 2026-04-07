import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { MapPin, Clock, Users, Check, X as XIcon } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";
import { usePressScale } from "../../hooks/usePressScale";
import { useGatherRSVP } from "../../hooks/useGatherRSVP";
import { STATUS_ICONS } from "../../constants/statusIcons";
import { formatTimeLeft } from "../../lib/formatTime";
import { AvatarStack } from "./AvatarStack";
import { STATUS_LABELS, type Gather, type Profile } from "../../types";

interface GatherCardProps {
  gather: Gather;
  currentUserId: string | null;
}

export function GatherCard({ gather, currentUserId }: GatherCardProps) {
  const { animatedStyle: animatedScale, onPressIn, onPressOut } = usePressScale(0.975);

  const isMine = currentUserId === gather.created_by;
  const invites = gather.invites ?? [];
  const { inCount, rsvpButtonProps } = useGatherRSVP(
    gather.id,
    currentUserId,
    isMine,
    invites,
    gather.in_count ?? 0
  );

  const activityLabel = gather.status_type === "custom"
    ? gather.custom_text ?? "Gathering"
    : STATUS_LABELS[gather.status_type];

  const timeLeft = formatTimeLeft(gather.expires_at);
  const ContextIcon = STATUS_ICONS[gather.status_type];

  const inProfiles: Profile[] = invites
    .filter((i) => i.rsvp === "in" && i.profile)
    .map((i) => i.profile!);
  // Add host profile if not already in the invites list
  if (gather.profile && !inProfiles.find((p) => p.id === gather.created_by)) {
    inProfiles.unshift(gather.profile);
  }

  const startsAtLabel = gather.starts_at
    ? formatStartsAt(gather.starts_at)
    : null;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(20).stiffness(200).duration(350)}
      style={animatedScale}
    >
      <Pressable
        style={styles.container}
        onPressIn={() => {
          Haptics.selectionAsync();
          onPressIn();
        }}
        onPressOut={onPressOut}
      >
        {/* Badge */}
        <View style={styles.header}>
          <AvatarStack
            profiles={inProfiles}
            totalCount={inCount}
            size={28}
          />
          <View style={styles.badge}>
            <Users size={11} color={theme.warm} strokeWidth={2.25} />
            <Text style={styles.badgeText}>GATHER</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {gather.title}
        </Text>

        {/* Activity + venue row */}
        <View style={styles.detailRow}>
          {ContextIcon && (
            <ContextIcon size={14} color={theme.muted} strokeWidth={1.75} />
          )}
          <Text style={styles.detailText}>{activityLabel}</Text>
          {gather.venue_name && (
            <>
              <Text style={styles.dot}>·</Text>
              <MapPin size={12} color={theme.muted} strokeWidth={1.75} />
              <Text style={styles.detailText} numberOfLines={1}>
                {gather.venue_name}
              </Text>
            </>
          )}
        </View>

        {gather.custom_text && gather.status_type !== "custom" && (
          <Text style={styles.customText} numberOfLines={2}>
            {gather.custom_text}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.metaRow}>
              {startsAtLabel && (
                <>
                  <Clock size={12} color={theme.muted} strokeWidth={1.75} />
                  <Text style={styles.metaText}>{startsAtLabel}</Text>
                  <Text style={styles.dot}>·</Text>
                </>
              )}
              <Text style={styles.metaText}>{timeLeft}</Text>
            </View>
            {inCount > 0 && (
              <Text style={styles.inCount}>
                {inCount} {inCount === 1 ? "person" : "people"} in
              </Text>
            )}
          </View>

          {/* RSVP buttons */}
          {currentUserId && (
            <View style={styles.rsvpRow}>
              <Pressable
                style={[
                  styles.rsvpBtn,
                  rsvpButtonProps.state === "in" ? styles.rsvpBtnInActive : styles.rsvpBtnIn,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  rsvpButtonProps.onIn();
                }}
                disabled={rsvpButtonProps.loading}
              >
                <Check
                  size={14}
                  color={rsvpButtonProps.state === "in" ? "#FFFFFF" : theme.green}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.rsvpText,
                    rsvpButtonProps.state === "in" ? styles.rsvpTextActive : styles.rsvpTextIn,
                  ]}
                >
                  {rsvpButtonProps.state === "in" ? "I'm in" : "In"}
                </Text>
              </Pressable>

              {rsvpButtonProps.state !== "in" && (
                <Pressable
                  style={[
                    styles.rsvpBtn,
                    rsvpButtonProps.state === "out" ? styles.rsvpBtnOutActive : styles.rsvpBtnOut,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    rsvpButtonProps.onOut();
                  }}
                  disabled={rsvpButtonProps.loading}
                >
                  <XIcon
                    size={14}
                    color={rsvpButtonProps.state === "out" ? "#FFFFFF" : theme.muted}
                    strokeWidth={2.5}
                  />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function formatStartsAt(startsAt: string): string {
  const d = new Date(startsAt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();

  if (diffMs < 0) return "Started";
  if (diffMs < 60 * 60 * 1000) {
    const mins = Math.round(diffMs / 60000);
    return `in ${mins}m`;
  }

  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return minutes === 0 ? `${h} ${ampm}` : `${h}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    padding: 20,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.warm,
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
  title: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 18,
    color: theme.text,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  detailText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
    flexShrink: 1,
  },
  dot: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
  },
  customText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    color: theme.muted,
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    gap: 2,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
    fontVariant: ["tabular-nums"],
  },
  inCount: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.warm,
  },
  rsvpRow: {
    flexDirection: "row",
    gap: 6,
  },
  rsvpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
  } as any,
  rsvpBtnIn: {
    backgroundColor: theme.greenTint,
  },
  rsvpBtnInActive: {
    backgroundColor: theme.green,
  },
  rsvpBtnOut: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 10,
  },
  rsvpBtnOutActive: {
    backgroundColor: theme.muted,
    paddingHorizontal: 10,
  },
  rsvpText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 13,
  },
  rsvpTextIn: {
    color: theme.green,
  },
  rsvpTextActive: {
    color: "#FFFFFF",
  },
});
