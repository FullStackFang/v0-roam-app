import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeOutDown, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Wrench, Flame, Trash2, MapPin, X } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";
import { seedAround, clearSeedData, seedCornellLaunch } from "../../lib/queries";

interface DevPanelProps {
  userCoords: [number, number] | null;
  onToast: (msg: string) => void;
}

const ACTIONS = [
  { id: "seed", label: "Seed activity", Icon: Flame, color: theme.warm },
  { id: "seed_cornell", label: "Seed Cornell launch", Icon: MapPin, color: theme.green },
  { id: "clear", label: "Clear seed data", Icon: Trash2, color: theme.error },
] as const;

export function DevPanel({ userCoords, onToast }: DevPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (id: string) => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(id);

    try {
      if (id === "seed") {
        if (!userCoords) {
          onToast("No location — enable GPS first");
          return;
        }
        await seedAround(userCoords[1], userCoords[0]);
        onToast("Seeded 8 users around you");
      } else if (id === "seed_cornell") {
        await seedCornellLaunch();
        onToast("Seeded 20 users across Cornell");
      } else if (id === "clear") {
        await clearSeedData();
        onToast("Seed data cleared");
      }
    } catch (err: any) {
      onToast(err.message ?? "Action failed");
    } finally {
      setLoading(null);
      setOpen(false);
    }
  };

  return (
    <View style={styles.anchor}>
      {/* Expanded actions */}
      {open && (
        <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOutDown.duration(150)} style={styles.menu}>
          {ACTIONS.map((action) => (
            <ActionRow
              key={action.id}
              label={action.label}
              Icon={action.Icon}
              color={action.color}
              loading={loading === action.id}
              onPress={() => handleAction(action.id)}
            />
          ))}
        </Animated.View>
      )}

      {/* Toggle button */}
      <DevButton
        open={open}
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(!open);
        }}
      />
    </View>
  );
}

function DevButton({ open, onPress }: { open: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.fab, open && styles.fabOpen]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.9, theme.spring.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, theme.spring.bouncy); }}
      >
        {open ? (
          <X size={18} color={theme.muted} strokeWidth={2} />
        ) : (
          <Wrench size={18} color={theme.muted} strokeWidth={1.75} />
        )}
      </Pressable>
    </Animated.View>
  );
}

function ActionRow({
  label,
  Icon,
  color,
  loading,
  onPress,
}: {
  label: string;
  Icon: React.ElementType;
  color: string;
  loading: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.actionRow, loading && { opacity: 0.5 }]}
        onPress={onPress}
        disabled={loading}
        onPressIn={() => { scale.value = withSpring(0.97, theme.spring.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, theme.spring.bouncy); }}
      >
        <Icon size={16} color={color} strokeWidth={1.75} />
        <Text style={styles.actionLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    bottom: 160,
    right: 20,
    zIndex: theme.z.fab,
    alignItems: "flex-end",
    gap: 8,
  },
  menu: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    boxShadow: theme.shadow.card,
    overflow: "hidden",
  } as any,
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: theme.shadow.pill,
  } as any,
  fabOpen: {
    backgroundColor: theme.bg,
    borderColor: theme.muted,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 180,
  },
  actionLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
    color: theme.text,
  },
});
