import React, { useRef, useCallback } from "react";
import { ScrollView, Pressable, Text, View, Animated, StyleSheet } from "react-native";
import {
  Sun,
  Utensils,
  Calendar,
  Dumbbell,
  Trees,
  BookOpen,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import type { FilterCategory } from "../../types";

interface FilterBarProps {
  value: FilterCategory;
  onChange: (value: FilterCategory) => void;
}

const filters: { key: FilterCategory; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All", icon: Sun },
  { key: "eatdrink", label: "Eat", icon: Utensils },
  { key: "happening", label: "Events", icon: Calendar },
  { key: "move", label: "Move", icon: Dumbbell },
  { key: "outside", label: "Outside", icon: Trees },
  { key: "focus", label: "Focus", icon: BookOpen },
];

function FilterPill({
  filter,
  active,
  onPress,
}: {
  filter: (typeof filters)[number];
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const Icon = filter.icon;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.93,
      ...theme.spring.snappy,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      ...theme.spring.bouncy,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.pill, active && styles.pillActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Icon
          size={14}
          color={active ? "#fff" : theme.muted}
          strokeWidth={1.75}
        />
        <Text style={[styles.label, active && styles.labelActive]}>
          {filter.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const TOP_BAR_HEIGHT = 44;
const TIME_TOGGLE_HEIGHT = 42;

export function FilterBar({ value, onChange }: FilterBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        { top: insets.top + TOP_BAR_HEIGHT + TIME_TOGGLE_HEIGHT + 20 },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {filters.map((f) => (
          <FilterPill
            key={f.key}
            filter={f}
            active={value === f.key}
            onPress={() => onChange(f.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
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
  label: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.muted,
  },
  labelActive: {
    color: "#fff",
  },
});
