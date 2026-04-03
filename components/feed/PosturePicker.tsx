import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { Check, Users, HelpCircle, X } from "lucide-react-native";
import { theme } from "../../constants/theme";
import type { PostureType } from "../../types";

const SHEET_HEIGHT = 280;

interface PosturePickerProps {
  visible: boolean;
  onSelect: (posture: PostureType) => void;
  onClose: () => void;
}

const postures: {
  type: PostureType;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    type: "definitely_in",
    label: "Definitely in",
    desc: "I'm committed",
    icon: Check,
    color: theme.green,
    bg: "rgba(56,160,122,0.08)",
    border: "rgba(56,160,122,0.25)",
  },
  {
    type: "down_if_others",
    label: "Down if others are",
    desc: "Convince me",
    icon: Users,
    color: theme.warm,
    bg: "rgba(224,138,60,0.08)",
    border: "rgba(224,138,60,0.25)",
  },
  {
    type: "sell_me",
    label: "Sell me on it",
    desc: "I'm curious",
    icon: HelpCircle,
    color: theme.muted,
    bg: "rgba(0,0,0,0.02)",
    border: theme.border,
  },
];

export function PosturePicker({ visible, onSelect, onClose }: PosturePickerProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      ...theme.spring.bouncy,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.handle} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title}>How in are you?</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={14} color={theme.muted} strokeWidth={2} />
          </Pressable>
        </View>

        {postures.map((p) => {
          const Icon = p.icon;
          return (
            <Pressable
              key={p.type}
              style={[
                styles.option,
                { backgroundColor: p.bg, borderColor: p.border },
              ]}
              onPress={() => onSelect(p.type)}
            >
              <Icon size={18} color={p.color} strokeWidth={1.75} />
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: p.color }]}>
                  {p.label}
                </Text>
                <Text style={styles.optionDesc}>{p.desc}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
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
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 2,
    marginTop: 14,
    alignSelf: "center",
  },
  body: {
    paddingTop: 14,
    paddingHorizontal: 22,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    color: theme.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 15,
  },
  optionDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
    marginTop: 1,
  },
});
