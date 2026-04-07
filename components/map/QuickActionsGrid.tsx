import React, { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import {
  Utensils,
  Wine,
  Footprints,
  Sparkles,
  Coffee,
  Flame,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Users,
  Globe,
} from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { usePressScale } from "../../hooks/usePressScale";
import { useBroadcasts } from "../../lib/BroadcastsContext";
import { theme } from "../../constants/theme";
import { QUICK_ACTION_OPTIONS, INTENT_OPTIONS } from "../../types";
import type { StatusType, BroadcastDuration, AudienceType, Circle } from "../../types";

/* ── Grid data ──────────────────────────────────────────────── */

type GridItemType = StatusType | "gather";

interface GridItemDef {
  type: GridItemType;
  label: string;
  Icon: React.ElementType;
  isGather?: boolean;
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
  { type: "gather", label: "Gather", Icon: Flame, isGather: true },
];

const ROW_1 = GRID_ITEMS.slice(0, 3);
const ROW_2 = GRID_ITEMS.slice(3);

/* ── Props ──────────────────────────────────────────────────── */

export interface GoLiveParams {
  statusType: StatusType;
  duration: BroadcastDuration;
  customText?: string;
  audienceType?: AudienceType;
  audienceCircleId?: string;
}

interface QuickActionsGridProps {
  isLive: boolean;
  activeStatusType: StatusType | null;
  onSelect: (params: GoLiveParams) => void;
  onClose: () => void;
  onGatherPress: () => void;
}

/* ── Main Component ────────────────────────────────────────── */

export function QuickActionsGrid({
  isLive,
  activeStatusType,
  onSelect,
  onClose,
  onGatherPress,
}: QuickActionsGridProps) {
  const [step, setStep] = useState<"intent" | "activity">(isLive ? "activity" : "intent");
  const [selectedDuration, setSelectedDuration] = useState<BroadcastDuration>("1h");

  const handleIntentSelect = (duration: BroadcastDuration) => {
    Haptics.selectionAsync();
    setSelectedDuration(duration);
    setStep("activity");
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    setStep("intent");
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(22).stiffness(180)}
      exiting={FadeOutDown.springify().damping(18).stiffness(240)}
      style={styles.container}
    >
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {step === "intent" ? (
          <Animated.View key="intent" entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
            <IntentStep onSelect={handleIntentSelect} onClose={onClose} />
          </Animated.View>
        ) : (
          <Animated.View key="activity" entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
            <ActivityStep
              isLive={isLive}
              activeStatusType={activeStatusType}
              selectedDuration={selectedDuration}
              onSelect={onSelect}
              onBack={!isLive ? handleBack : undefined}
              onClose={onClose}
              onGatherPress={onGatherPress}
            />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

/* ── Step 1: Intent Picker ─────────────────────────────────── */

function IntentStep({
  onSelect,
  onClose,
}: {
  onSelect: (duration: BroadcastDuration) => void;
  onClose: () => void;
}) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>I'm...</Text>
        <Pressable
          style={styles.closeBtn}
          hitSlop={12}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onClose();
          }}
        >
          <X size={18} color={theme.muted} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.intentList}>
        {INTENT_OPTIONS.map((opt, i) => (
          <IntentCard
            key={opt.intent}
            option={opt}
            index={i}
            onPress={() => onSelect(opt.duration)}
          />
        ))}
      </View>
    </>
  );
}

/* ── Intent Card ───────────────────────────────────────────── */

function IntentCard({
  option,
  index,
  onPress,
}: {
  option: (typeof INTENT_OPTIONS)[number];
  index: number;
  onPress: () => void;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.96);

  return (
    <Animated.View
      entering={FadeInDown.delay(60 + index * 80)
        .springify()
        .damping(20)
        .stiffness(200)}
      style={animatedStyle}
    >
      <Pressable
        style={styles.intentCard}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text style={styles.intentEmoji}>{option.emoji}</Text>
        <View style={styles.intentTextWrap}>
          <Text style={styles.intentLabel}>{option.label}</Text>
          <Text style={styles.intentDesc}>{option.description}</Text>
        </View>
        <ChevronRight size={18} color={theme.muted} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

/* ── Step 2: Activity Picker ───────────────────────────────── */

function ActivityStep({
  isLive,
  activeStatusType,
  selectedDuration,
  onSelect,
  onBack,
  onClose,
  onGatherPress,
}: {
  isLive: boolean;
  activeStatusType: StatusType | null;
  selectedDuration: BroadcastDuration;
  onSelect: (params: GoLiveParams) => void;
  onBack?: () => void;
  onClose: () => void;
  onGatherPress: () => void;
}) {
  const [customText, setCustomText] = useState("");
  const { circles } = useBroadcasts();
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);

  const buildParams = (statusType: StatusType, text?: string): GoLiveParams => ({
    statusType,
    duration: selectedDuration,
    customText: text,
    audienceType: selectedCircle ? "circle" : "everyone",
    audienceCircleId: selectedCircle?.id,
  });

  const handleSelect = (statusType: StatusType) => {
    Haptics.selectionAsync();
    onSelect(buildParams(statusType, customText.trim() || undefined));
  };

  const handleCustomGo = () => {
    if (!customText.trim()) return;
    Haptics.selectionAsync();
    onSelect(buildParams("custom", customText.trim()));
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <Pressable
              style={styles.backBtn}
              hitSlop={12}
              onPress={onBack}
            >
              <ChevronLeft size={22} color={theme.text} strokeWidth={2} />
            </Pressable>
          )}
          <Text style={styles.title}>
            {isLive ? "Switch activity" : "What are you up to?"}
          </Text>
        </View>
        <Pressable
          style={styles.closeBtn}
          hitSlop={12}
          onPress={() => {
            if (isLive) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            onClose();
          }}
        >
          <X size={18} color={isLive ? theme.error : theme.muted} strokeWidth={2} />
        </Pressable>
      </View>

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
                  if (item.isGather) {
                    onGatherPress();
                    return;
                  }
                  handleSelect(item.type as StatusType);
                }}
              />
            ))}
          </View>
        ))}
      </View>

      {!isLive && (
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Add a note..."
            placeholderTextColor={theme.muted}
            value={customText}
            onChangeText={setCustomText}
            maxLength={80}
            returnKeyType="send"
            onSubmitEditing={handleCustomGo}
          />
          {customText.trim().length > 0 && (
            <Pressable style={styles.customGoBtn} onPress={handleCustomGo}>
              <Send size={16} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          )}
        </View>
      )}

      {!isLive && circles.length > 0 && (
        <View style={styles.audienceRow}>
          <Pressable
            style={[styles.audiencePill, !selectedCircle && styles.audiencePillActive]}
            onPress={() => { Haptics.selectionAsync(); setSelectedCircle(null); }}
          >
            <Globe size={13} color={!selectedCircle ? theme.accent : theme.muted} strokeWidth={2} />
            <Text style={[styles.audienceText, !selectedCircle && styles.audienceTextActive]}>Everyone</Text>
          </Pressable>
          {circles.map((c) => {
            const active = selectedCircle?.id === c.id;
            return (
              <Pressable
                key={c.id}
                style={[styles.audiencePill, active && styles.audiencePillActive]}
                onPress={() => { Haptics.selectionAsync(); setSelectedCircle(active ? null : c); }}
              >
                <Users size={13} color={active ? theme.accent : theme.muted} strokeWidth={2} />
                <Text style={[styles.audienceText, active && styles.audienceTextActive]} numberOfLines={1}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </>
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
      style={[styles.gridItem, animatedStyle]}
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

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
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
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },

  /* Intent step */
  intentList: {
    gap: 10,
  },
  intentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.bg,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  } as any,
  intentEmoji: {
    fontSize: 24,
  },
  intentTextWrap: {
    flex: 1,
    gap: 2,
  },
  intentLabel: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: theme.text,
  },
  intentDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
  },

  /* Activity grid */
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

  /* Custom text input */
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  customInput: {
    flex: 1,
    height: 42,
    backgroundColor: theme.bg,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    color: theme.text,
  } as any,
  customGoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Audience selector */
  audienceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  audiencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    backgroundColor: theme.bg,
  } as any,
  audiencePillActive: {
    backgroundColor: theme.accentFill,
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  audienceText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.muted,
    maxWidth: 100,
  },
  audienceTextActive: {
    color: theme.accent,
    fontFamily: theme.fonts.sansSemiBold,
  },
});
