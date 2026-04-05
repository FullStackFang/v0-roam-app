import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Wine, Coffee, Footprints, Sparkles } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";
import type { StatusType } from "../../types";

const CONTEXT_PILLS: { type: StatusType; label: string; Icon: React.ElementType }[] = [
  { type: "up_for_drinks", label: "Drinks", Icon: Wine },
  { type: "grabbing_coffee", label: "Coffee", Icon: Coffee },
  { type: "walk", label: "Walk", Icon: Footprints },
  { type: "open", label: "Open", Icon: Sparkles },
];

interface ContextSheetProps {
  visible: boolean;
  onSelect: (statusType: StatusType) => void;
  onSkip: () => void;
}

export function ContextSheet({ visible, onSelect, onSkip }: ContextSheetProps) {
  if (!visible) return null;

  const handleSelect = (statusType: StatusType) => {
    Haptics.selectionAsync();
    onSelect(statusType);
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(180)}
      style={styles.container}
    >
      <View style={styles.handle} />
      <View style={styles.body}>
        <Text style={styles.title}>What are you up to?</Text>

        <View style={styles.pillRow}>
          {CONTEXT_PILLS.map((opt, i) => (
            <ContextPill
              key={opt.type}
              Icon={opt.Icon}
              label={opt.label}
              index={i}
              onPress={() => handleSelect(opt.type)}
            />
          ))}
        </View>

        <Pressable style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function ContextPill({
  Icon,
  label,
  index,
  onPress,
}: {
  Icon: React.ElementType;
  label: string;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(80 + index * 60).springify().damping(18).stiffness(180)}
      style={[{ flex: 1 }, animatedStyle]}
    >
      <Pressable
        style={styles.pill}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.93, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }}
      >
        <Icon size={20} color={theme.text} strokeWidth={1.5} />
        <Text style={styles.pillLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: theme.z.sheet,
    backgroundColor: theme.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderCurve: "continuous",
    boxShadow: theme.shadow.sheet,
    paddingBottom: 34,
  } as any,
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 2,
    marginTop: 14,
    alignSelf: "center",
  },
  body: {
    paddingTop: 16,
    paddingHorizontal: 22,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    color: theme.text,
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  pill: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    backgroundColor: theme.bg,
    boxShadow: theme.shadow.pill,
  } as any,
  pillLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.text,
  },
  skipBtn: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  skipText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
  },
});
