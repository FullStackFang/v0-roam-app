import React from "react";
import { ScrollView, Pressable, Text, View, StyleSheet } from "react-native";
import { Flame } from "lucide-react-native";
import { theme } from "../../constants/theme";
import type { Circle } from "../../types";

interface CircleFilterBarProps {
  circles: Circle[];
  selected: string | null; // null = "All"
  onSelect: (circleId: string | null) => void;
}

export function CircleFilterBar({
  circles,
  selected,
  onSelect,
}: CircleFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Pressable
        style={[styles.pill, selected === null && styles.pillActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.pillText, selected === null && styles.pillTextActive]}>
          All
        </Text>
      </Pressable>

      {circles.map((c) => {
        const active = selected === c.id;
        return (
          <Pressable
            key={c.id}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(c.id)}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {c.name}
            </Text>
            {c.streak_count > 1 && (
              <View style={styles.streakBadge}>
                <Flame
                  size={10}
                  color={active ? "#fff" : theme.warm}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.streakText,
                    active && { color: "#fff" },
                  ]}
                >
                  {c.streak_count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
    paddingBottom: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.surfaceGlass,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillActive: {
    backgroundColor: theme.text,
    borderColor: theme.text,
  },
  pillText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.muted,
  },
  pillTextActive: {
    color: "#fff",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  streakText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 10,
    color: theme.warm,
  },
});
