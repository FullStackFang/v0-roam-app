import React from "react";
import { Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Globe, Users } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { useBroadcasts } from "../../lib/BroadcastsContext";
import { theme } from "../../constants/theme";

export function CircleFilterBar() {
  const { circles, activeCircleFilter, setActiveCircleFilter } = useBroadcasts();

  if (circles.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      <Pressable
        style={[styles.pill, !activeCircleFilter && styles.pillActive]}
        onPress={() => {
          Haptics.selectionAsync();
          setActiveCircleFilter(null);
        }}
      >
        <Globe size={13} color={!activeCircleFilter ? theme.accent : theme.muted} strokeWidth={2} />
        <Text style={[styles.pillText, !activeCircleFilter && styles.pillTextActive]}>All</Text>
      </Pressable>

      {circles.map((c) => {
        const active = activeCircleFilter?.id === c.id;
        return (
          <Pressable
            key={c.id}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveCircleFilter(active ? null : c);
            }}
          >
            <Users size={13} color={active ? theme.accent : theme.muted} strokeWidth={2} />
            <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
              {c.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: theme.border,
  } as any,
  pillActive: {
    backgroundColor: theme.accentFill,
    borderColor: theme.accentBorder,
  },
  pillText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.muted,
    maxWidth: 80,
  },
  pillTextActive: {
    color: theme.accent,
    fontFamily: theme.fonts.sansSemiBold,
  },
});
