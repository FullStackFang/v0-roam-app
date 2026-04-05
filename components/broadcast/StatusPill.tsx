import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, Animated, Easing, StyleSheet } from "react-native";
import * as Haptics from "../../lib/haptics";
import { theme } from "../../constants/theme";
import {
  AVAILABILITY_OPTIONS,
  type StatusBroadcast,
  type BroadcastDuration,
} from "../../types";

interface StatusPillProps {
  broadcast: StatusBroadcast;
  onChangeAvailability: (duration: BroadcastDuration) => void;
  onEndBroadcast: () => void;
}

function formatCountdown(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "0m";
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function emojiForDuration(duration: BroadcastDuration): string {
  const opt = AVAILABILITY_OPTIONS.find((o) => o.duration === duration);
  return opt?.emoji ?? "\ud83d\udfe2";
}

export function StatusPill({
  broadcast,
  onChangeAvailability,
  onEndBroadcast,
}: StatusPillProps) {
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(broadcast.expires_at)
  );
  const [isOpen, setIsOpen] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const [isUrgent, setIsUrgent] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Update countdown every 15s
  useEffect(() => {
    const update = () => {
      const ms = new Date(broadcast.expires_at).getTime() - Date.now();
      if (ms <= 0) {
        onEndBroadcast();
        return;
      }
      setCountdown(formatCountdown(broadcast.expires_at));
      setIsUrgent(ms < 5 * 60 * 1000);
    };
    update();
    const id = setInterval(update, 15_000);
    return () => clearInterval(id);
  }, [broadcast.expires_at, onEndBroadcast]);

  // Breathing pulse for live dot
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: isUrgent ? 600 : 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: isUrgent ? 600 : 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isUrgent]);

  // Expand/collapse animation
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isOpen ? 1 : 0,
      damping: isOpen ? 22 : 20,
      stiffness: isOpen ? 180 : 280,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const handleSelect = useCallback(
    (duration: BroadcastDuration) => {
      Haptics.selectionAsync();
      onChangeAvailability(duration);
      setIsOpen(false);
    },
    [onChangeAvailability]
  );

  const handleHidden = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsOpen(false);
    onEndBroadcast();
  }, [onEndBroadcast]);

  const ROW_HEIGHT = 36;
  const COLLAPSED_HEIGHT = 36;
  const EXPANDED_HEIGHT = ROW_HEIGHT * 4 + 8; // 3 availability + hidden + padding

  const animatedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_HEIGHT, EXPANDED_HEIGHT],
  });

  const emoji = emojiForDuration(broadcast.duration);

  return (
    <View style={styles.anchor}>
      {isOpen && (
        <Pressable style={styles.dismissOverlay} onPress={() => setIsOpen(false)} />
      )}

      <Animated.View
        style={[
          styles.pill,
          { height: animatedHeight },
          isOpen && styles.pillOpen,
        ]}
      >
        {/* Collapsed row */}
        <Pressable style={styles.row} onPress={() => {
          Haptics.selectionAsync();
          setIsOpen(!isOpen);
        }}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={[styles.countdown, isUrgent && { color: theme.accent }]}>
            {countdown}
          </Text>
          <Animated.View
            style={[
              styles.liveDot,
              isUrgent && { backgroundColor: theme.accent },
              { opacity: pulseAnim },
            ]}
          />
        </Pressable>

        {/* Expanded options */}
        {AVAILABILITY_OPTIONS.map((opt) => {
          const active = broadcast.duration === opt.duration;
          return (
            <Animated.View
              key={opt.duration}
              style={{
                opacity: expandAnim,
                height: isOpen ? ROW_HEIGHT : 0,
                overflow: "hidden",
              }}
            >
              <Pressable
                style={styles.optionRow}
                onPress={() => handleSelect(opt.duration)}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text
                  style={[styles.optionLabel, active && styles.optionLabelActive]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Hidden option */}
        <Animated.View
          style={{
            opacity: expandAnim,
            height: isOpen ? ROW_HEIGHT : 0,
            overflow: "hidden",
          }}
        >
          <Pressable style={styles.optionRow} onPress={handleHidden}>
            <Text style={styles.optionEmoji}>{"\u26ab"}</Text>
            <Text style={styles.optionLabel}>Go hidden</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "relative",
    zIndex: theme.z.pill,
    marginRight: 20,
  },
  dismissOverlay: {
    position: "absolute",
    top: -200,
    left: -400,
    right: -400,
    bottom: -2000,
    zIndex: -1,
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    overflow: "hidden",
    boxShadow: theme.shadow.pill,
  } as any,
  pillOpen: {
    backgroundColor: "rgba(255,255,255,0.96)",
    boxShadow: "0px 4px 16px rgba(26,27,30,0.10), 0px 1px 4px rgba(26,27,30,0.06)",
  } as any,
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    gap: 6,
  },
  emoji: {
    fontSize: 14,
  },
  countdown: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 12,
    color: theme.text,
    letterSpacing: 0.3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.green,
    marginLeft: 2,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    gap: 8,
    paddingLeft: 2,
  },
  optionEmoji: {
    fontSize: 14,
  },
  optionLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.text,
  },
  optionLabelActive: {
    color: theme.accent,
    fontFamily: theme.fonts.sansSemiBold,
  },
});
