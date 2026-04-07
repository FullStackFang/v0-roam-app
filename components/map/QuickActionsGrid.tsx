import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
} from "react-native-reanimated";
import {
  Utensils,
  Wine,
  Footprints,
  Sparkles,
  Coffee,
  Zap,
  X,
} from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { usePressScale } from "../../hooks/usePressScale";
import { theme } from "../../constants/theme";
import { QUICK_ACTION_OPTIONS } from "../../types";
import type { StatusType } from "../../types";

/* ── Grid data ──────────────────────────────────────────────── */

type GridItemType = StatusType | "spark";

interface GridItemDef {
  type: GridItemType;
  label: string;
  Icon: React.ElementType;
  disabled?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils, Wine, Footprints, Sparkles, Coffee,
};

const GRID_ITEMS: GridItemDef[] = [
  ...QUICK_ACTION_OPTIONS.map((o) => ({
    type: o.type as GridItemType,
    label: o.label,
    Icon: ICON_MAP[o.iconName],
  })),
  { type: "spark", label: "Spark", Icon: Zap, disabled: true },
];

const ROW_1 = GRID_ITEMS.slice(0, 3);
const ROW_2 = GRID_ITEMS.slice(3);

/* ── Props ──────────────────────────────────────────────────── */

interface QuickActionsGridProps {
  isLive: boolean;
  activeStatusType: StatusType | null;
  onSelect: (statusType: StatusType) => void;
  onClose: () => void;
  onSparkPress: () => void;
}

/* ── Component ──────────────────────────────────────────────── */

export function QuickActionsGrid({
  isLive,
  activeStatusType,
  onSelect,
  onClose,
  onSparkPress,
}: QuickActionsGridProps) {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(22).stiffness(180)}
      exiting={FadeOutDown.springify().damping(18).stiffness(240)}
      style={styles.container}
    >
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isLive ? "Switch activity" : "What do you want to do?"}
          </Text>
          <Pressable
            style={styles.closeBtn}
            hitSlop={12}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onClose();
            }}
          >
            <X size={18} color={isLive ? theme.error : theme.muted} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {[ROW_1, ROW_2].map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((item, i) => (
                <GridItem
                  key={item.type}
                  item={item}
                  index={rowIdx * 3 + i}
                  isActive={isLive && item.type === activeStatusType}
                  onPress={() => {
                    if (item.disabled) {
                      onSparkPress();
                      return;
                    }
                    Haptics.selectionAsync();
                    onSelect(item.type as StatusType);
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

/* ── Grid item ──────────────────────────────────────────────── */

function GridItem({
  item,
  index,
  isActive,
  onPress,
}: {
  item: GridItemDef;
  index: number;
  isActive: boolean;
  onPress: () => void;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.92);

  const { Icon } = item;

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 50)
        .springify()
        .damping(20)
        .stiffness(200)}
      style={[styles.gridItem, animatedStyle, item.disabled && styles.gridItemDisabled]}
    >
      <Pressable
        style={styles.gridItemInner}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View
          style={[
            styles.iconCircle,
            isActive && styles.iconCircleActive,
          ]}
        >
          <Icon
            size={22}
            color={theme.accent}
            strokeWidth={1.75}
          />
        </View>
        <Text
          style={[
            styles.label,
            isActive && styles.labelActive,
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: theme.z.sheet,
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderCurve: "continuous",
    boxShadow: theme.shadow.sheet,
    paddingBottom: 28,
    paddingHorizontal: 22,
  } as any,
  handle: {
    width: 44,
    height: 5,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 3,
    marginTop: 12,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 18,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    gap: 14,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  gridItem: {
    flex: 1,
    alignItems: "center",
  },
  gridItemDisabled: {
    opacity: 0.4,
  },
  gridItemInner: {
    alignItems: "center",
    paddingVertical: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accentFill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleActive: {
    borderWidth: 2,
    borderColor: theme.accent,
  },
  label: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 12,
    color: theme.text,
    marginTop: 6,
    textAlign: "center",
  },
  labelActive: {
    color: theme.accent,
  },
});
