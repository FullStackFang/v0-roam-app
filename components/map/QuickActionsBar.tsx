import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Utensils, Wine, Footprints, Sparkles, Coffee } from "lucide-react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";
import { QUICK_ACTION_OPTIONS } from "../../types";
import type { StatusType } from "../../types";

const ICONS: Record<string, React.ElementType> = {
  Utensils,
  Wine,
  Footprints,
  Sparkles,
  Coffee,
};

const CARD_GAP = 12;
const HORIZONTAL_PAD = 24;

interface QuickActionsBarProps {
  onSelect: (statusType: StatusType) => void;
  onDismiss: () => void;
}

export function QuickActionsBar({ onSelect, onDismiss }: QuickActionsBarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - HORIZONTAL_PAD * 2 - CARD_GAP;
  const snapInterval = cardWidth + CARD_GAP;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
    if (index !== activeIndex) {
      setActiveIndex(index);
      Haptics.selectionAsync();
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(22).stiffness(180)}
      exiting={FadeOutDown.springify().damping(18).stiffness(240)}
      style={styles.container}
    >
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>What do you want to do?</Text>

        {/* Paging carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={false}
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.carouselContent,
            { paddingHorizontal: HORIZONTAL_PAD },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {QUICK_ACTION_OPTIONS.map((opt, i) => (
            <ActionCard
              key={opt.type}
              Icon={ICONS[opt.iconName]}
              label={opt.label}
              description={opt.description}
              width={cardWidth}
              index={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelect(opt.type);
              }}
            />
          ))}
        </ScrollView>

        {/* Page dots */}
        <View style={styles.dots}>
          {QUICK_ACTION_OPTIONS.map((opt, i) => (
            <View
              key={opt.type}
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Cancel */}
        <Pressable style={styles.cancelBtn} onPress={() => {
          Haptics.selectionAsync();
          onDismiss();
        }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function ActionCard({
  Icon,
  label,
  description,
  width,
  index,
  onPress,
}: {
  Icon: React.ElementType;
  label: string;
  description: string;
  width: number;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 50).springify().damping(20).stiffness(200)}
      style={[{ width, marginRight: CARD_GAP }, animatedStyle]}
    >
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, theme.spring.snappy);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, theme.spring.bouncy);
        }}
      >
        <View style={styles.cardIcon}>
          <Icon size={28} color={theme.accent} strokeWidth={1.75} />
        </View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
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
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderCurve: "continuous",
    boxShadow: theme.shadow.sheet,
    paddingBottom: 28,
  } as any,
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 2,
    marginTop: 12,
    alignSelf: "center",
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    color: theme.text,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: HORIZONTAL_PAD,
  },
  carouselContent: {
    gap: 0, // gap handled by card marginRight
  },
  card: {
    backgroundColor: theme.bg,
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    boxShadow: theme.shadow.card,
  } as any,
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.accentTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 17,
    color: theme.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  dotActive: {
    backgroundColor: theme.accent,
    width: 18,
    borderRadius: 4,
  },
  cancelBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  cancelText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 14,
    color: theme.muted,
  },
});
