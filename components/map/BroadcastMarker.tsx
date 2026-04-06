import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { StatusType } from "../../types";

/* ── Status → emoji + color mapping ──────────────────────────── */

const STATUS_MARKER: Record<StatusType, { emoji: string; bg: string }> = {
  up_for_drinks: { emoji: "🍷", bg: "#FF4D30" },
  up_for_dinner: { emoji: "🍽️", bg: "#FFAA33" },
  grabbing_coffee: { emoji: "☕", bg: "#F59E0B" },
  walk: { emoji: "🚶", bg: "#06B6D4" },
  open: { emoji: "✨", bg: "#10B981" },
  out_now: { emoji: "🔥", bg: "#FF5733" },
  custom: { emoji: "💬", bg: "#FF5733" },
};

/** Moment marker — visually distinct "something's forming" */
export const MOMENT_MARKER = { emoji: "🔥", bg: "#FF6B3D" };

/* ── Sizing constants ────────────────────────────────────────── */

const MARKER_SIZE = 40;
const MOMENT_SIZE = 48;
const EMOJI_SIZE = 18;
const MOMENT_EMOJI_SIZE = 22;

/* ── Component ───────────────────────────────────────────────── */

interface BroadcastMarkerProps {
  statusType: StatusType;
  isMoment?: boolean;
  isSelected?: boolean;
  onPress: () => void;
}

export function BroadcastMarker({
  statusType,
  isMoment = false,
  isSelected = false,
  onPress,
}: BroadcastMarkerProps) {
  const marker = isMoment ? MOMENT_MARKER : STATUS_MARKER[statusType];
  const size = isMoment ? MOMENT_SIZE : MARKER_SIZE;
  const emojiSize = isMoment ? MOMENT_EMOJI_SIZE : EMOJI_SIZE;

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Pressable onPress={onPress} hitSlop={12}>
        <View
          style={[
            styles.bubble,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: marker.bg,
              borderWidth: 2.5,
              borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.9)",
            },
          ]}
        >
          <Text style={[styles.emoji, { fontSize: emojiSize }]}>
            {marker.emoji}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    textAlign: "center",
    lineHeight: 28,
  },
});
