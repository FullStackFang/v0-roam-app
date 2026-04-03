import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MapPin, Clock, Check, Users, HelpCircle } from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { theme } from "../../constants/theme";
import { AvatarStack } from "./AvatarStack";
import type { Activity, Profile } from "../../types";

interface ActivityCardProps {
  activity: Activity;
  onJoin: () => void;
}

export function ActivityCard({ activity, onJoin }: ActivityCardProps) {
  const interests = activity.interests ?? [];
  const confirmed = interests.filter(
    (i) => i.posture === "definitely_in" || i.confirmed_at
  );
  const deciding = interests.filter(
    (i) => !i.confirmed_at && i.posture !== "definitely_in"
  );

  const confirmedProfiles = confirmed
    .map((i) => i.profile)
    .filter(Boolean) as Profile[];
  const decidingProfiles = deciding
    .map((i) => i.profile)
    .filter(Boolean) as Profile[];

  // Check if activity is approaching (within 2 hours)
  const isApproaching =
    activity.starts_at &&
    new Date(activity.starts_at).getTime() - Date.now() < 2 * 60 * 60 * 1000 &&
    new Date(activity.starts_at).getTime() > Date.now();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activity.title}</Text>

      {/* Meta row */}
      <View style={styles.metaRow}>
        {activity.venue && (
          <View style={styles.metaPill}>
            <MapPin size={11} color={theme.muted} strokeWidth={1.75} />
            <Text style={styles.metaText}>{activity.venue.name}</Text>
          </View>
        )}
        {activity.starts_at && (
          <View style={styles.metaPill}>
            <Clock size={11} color={theme.muted} strokeWidth={1.75} />
            <Text style={styles.metaText}>
              {formatDistanceToNow(new Date(activity.starts_at), {
                addSuffix: true,
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Posture breakdown */}
      <View style={styles.postureRow}>
        {confirmedProfiles.length > 0 && (
          <View style={styles.postureGroup}>
            <Check size={12} color={theme.green} strokeWidth={2} />
            <AvatarStack profiles={confirmedProfiles} size={20} />
            <Text style={styles.postureCount}>
              {confirmed.length} confirmed
            </Text>
          </View>
        )}
        {decidingProfiles.length > 0 && (
          <View style={styles.postureGroup}>
            <HelpCircle size={12} color={theme.warm} strokeWidth={1.75} />
            <AvatarStack profiles={decidingProfiles} size={20} />
            <Text style={styles.postureCount}>
              {deciding.length} deciding
            </Text>
          </View>
        )}
      </View>

      {/* Nudge banner */}
      {isApproaching && (
        <View style={styles.nudgeBanner}>
          <Text style={styles.nudgeText}>Still in for tonight?</Text>
          <View style={styles.nudgeBtns}>
            <Pressable style={styles.nudgeConfirm}>
              <Text style={styles.nudgeConfirmText}>Confirm</Text>
            </Pressable>
            <Pressable style={styles.nudgeCancel}>
              <Text style={styles.nudgeCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Join button */}
      {interests.length === 0 && (
        <Pressable style={styles.joinBtn} onPress={onJoin}>
          <Users size={14} color={theme.accent} strokeWidth={1.75} />
          <Text style={styles.joinText}>Join</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 10,
  },
  title: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 16,
    color: theme.text,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.lg,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  metaText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    color: theme.muted,
  },
  postureRow: {
    gap: 6,
  },
  postureGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postureCount: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
  },
  nudgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(224,138,60,0.08)",
    borderWidth: 1,
    borderColor: "rgba(224,138,60,0.2)",
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  nudgeText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
    color: theme.warm,
  },
  nudgeBtns: {
    flexDirection: "row",
    gap: 6,
  },
  nudgeConfirm: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(56,160,122,0.1)",
    borderWidth: 1,
    borderColor: "rgba(56,160,122,0.25)",
  },
  nudgeConfirmText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    color: theme.green,
  },
  nudgeCancel: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  nudgeCancelText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    color: theme.muted,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "rgba(240,77,44,0.25)",
    backgroundColor: "rgba(240,77,44,0.05)",
  },
  joinText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
    color: theme.accent,
  },
});
