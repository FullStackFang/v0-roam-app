import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Utensils,
  Calendar,
  Dumbbell,
  Trees,
  BookOpen,
} from "lucide-react-native";
import { theme } from "../../constants/theme";
import { AvatarStack } from "./AvatarStack";
import type { Venue, Profile } from "../../types";

const categoryIcons: Record<string, React.ElementType> = {
  eatdrink: Utensils,
  happening: Calendar,
  move: Dumbbell,
  outside: Trees,
  focus: BookOpen,
};

interface VenueCardProps {
  venue: Venue & { friend_count: number; friends: Profile[] };
}

export function VenueCard({ venue }: VenueCardProps) {
  const Icon = categoryIcons[venue.category] ?? Utensils;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon size={14} color={theme.muted} strokeWidth={1.75} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{venue.name}</Text>
          <Text style={styles.neighborhood}>{venue.neighborhood}</Text>
        </View>
      </View>
      {venue.friends.length > 0 && (
        <View style={styles.friendRow}>
          <AvatarStack
            profiles={venue.friends}
            totalCount={venue.friend_count}
            size={20}
          />
          <Text style={styles.friendText}>
            {venue.friend_count} friend{venue.friend_count !== 1 ? "s" : ""}{" "}
            here recently
          </Text>
        </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 15,
    color: theme.text,
  },
  neighborhood: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
    marginTop: 1,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  friendText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
  },
});
