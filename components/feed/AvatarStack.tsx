import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme, avatarColor } from "../../constants/theme";
import type { Profile } from "../../types";

interface AvatarStackProps {
  profiles: Profile[];
  totalCount?: number;
  size?: number;
  /** Map of userId → badge emoji to show as overlay on avatar */
  badges?: Record<string, string>;
}

export function AvatarStack({ profiles, totalCount, size = 24, badges }: AvatarStackProps) {
  const shown = profiles.slice(0, 4);
  const extra = (totalCount ?? profiles.length) - shown.length;
  const badgeSize = Math.max(14, size * 0.45);

  return (
    <View style={styles.container}>
      <View style={styles.stack}>
        {shown.map((p, i) => {
          const badgeEmoji = badges?.[p.id];
          return (
            <View
              key={p.id}
              style={[
                styles.avatar,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: avatarColor(p.id),
                  marginLeft: i > 0 ? -size * 0.25 : 0,
                  zIndex: shown.length - i,
                },
              ]}
            >
              <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
                {p.display_name.charAt(0).toUpperCase()}
              </Text>
              {badgeEmoji && (
                <View
                  style={[
                    styles.badge,
                    {
                      width: badgeSize,
                      height: badgeSize,
                      borderRadius: badgeSize / 2,
                      right: -2,
                      bottom: -2,
                    },
                  ]}
                >
                  <Text style={[styles.badgeEmoji, { fontSize: badgeSize * 0.65 }]}>
                    {badgeEmoji}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
      {shown.length === 1 && (
        <Text style={styles.name} numberOfLines={1}>
          {profiles[0].display_name}
        </Text>
      )}
      {shown.length > 1 && extra > 0 && (
        <Text style={styles.extra}>+{extra}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stack: {
    flexDirection: "row",
  },
  avatar: {
    borderWidth: 3,
    borderColor: theme.surface,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  } as any,
  avatarText: {
    fontFamily: theme.fonts.sansBold,
    color: "#fff",
  },
  badge: {
    position: "absolute",
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: theme.surface,
  },
  badgeEmoji: {
    textAlign: "center",
    lineHeight: 16,
  },
  name: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 14,
    color: theme.text,
    maxWidth: 120,
  },
  extra: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.muted,
  },
});
