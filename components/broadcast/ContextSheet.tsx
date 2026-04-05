import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { theme } from "../../constants/theme";
import { CONTEXT_OPTIONS, type StatusType } from "../../types";

const SHEET_HEIGHT = 200;

interface ContextSheetProps {
  visible: boolean;
  onSelect: (statusType: StatusType) => void;
  onSkip: () => void;
}

export function ContextSheet({ visible, onSelect, onSkip }: ContextSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const pillAnims = useRef(
    CONTEXT_OPTIONS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      ...theme.spring.bouncy,
    }).start();

    if (visible) {
      // Stagger pills entrance
      pillAnims.forEach((anim, i) => {
        anim.setValue(0);
        Animated.spring(anim, {
          toValue: 1,
          delay: 80 + i * 50,
          ...theme.spring.gentle,
        }).start();
      });
    }
  }, [visible]);

  const handleSelect = (statusType: StatusType) => {
    Haptics.selectionAsync();
    onSelect(statusType);
  };

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={styles.handle} />
      <View style={styles.body}>
        <Text style={styles.title}>What are you up to?</Text>

        <View style={styles.pillRow}>
          {CONTEXT_OPTIONS.map((opt, i) => (
            <AnimatedPill
              key={opt.type}
              anim={pillAnims[i]}
              emoji={opt.emoji}
              label={opt.label}
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

function AnimatedPill({
  anim,
  emoji,
  label,
  onPress,
}: {
  anim: Animated.Value;
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          { scale },
        ],
      }}
    >
      <Pressable
        style={styles.pill}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.93, ...theme.spring.snappy }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, ...theme.spring.bouncy }).start()
        }
      >
        <Text style={styles.pillEmoji}>{emoji}</Text>
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
    borderTopWidth: 1,
    borderTopColor: theme.border,
    shadowColor: "#1A1B1E",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    marginTop: 14,
    alignSelf: "center",
  },
  body: {
    paddingTop: 16,
    paddingHorizontal: 22,
  },
  title: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 14,
    color: theme.muted,
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  pill: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillEmoji: {
    fontSize: 22,
  },
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
