import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  StyleSheet,
  Alert,
} from "react-native";
import {
  Radio,
  Wine,
  UtensilsCrossed,
  Coffee,
  Pencil,
  X,
} from "lucide-react-native";
import { theme } from "../../constants/theme";
import { insertBroadcast, fetchActiveBroadcasts } from "../../lib/queries";
import type { StatusType, BroadcastDuration } from "../../types";

const SHEET_HEIGHT = 420;

interface BroadcastSheetProps {
  visible: boolean;
  onClose: () => void;
  onBroadcast: () => void;
}

const presets: { type: StatusType; label: string; icon: React.ElementType }[] = [
  { type: "out_now", label: "Out now", icon: Radio },
  { type: "up_for_drinks", label: "Up for drinks", icon: Wine },
  { type: "up_for_dinner", label: "Up for dinner", icon: UtensilsCrossed },
  { type: "grabbing_coffee", label: "Grabbing coffee", icon: Coffee },
];

const durations: { value: BroadcastDuration; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "until_2am", label: "Until 2am" },
  { value: "24h", label: "24 hours" },
];

export function BroadcastSheet({
  visible,
  onClose,
  onBroadcast,
}: BroadcastSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [selectedType, setSelectedType] = useState<StatusType | null>(null);
  const [customText, setCustomText] = useState("");
  const [duration, setDuration] = useState<BroadcastDuration>("1h");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      ...theme.spring.bouncy,
    }).start();

    if (visible) {
      setSelectedType(null);
      setCustomText("");
      setDuration("1h");
    }
  }, [visible]);

  const handleBroadcast = async () => {
    if (!selectedType && !customText.trim()) return;

    // Check max 3 active
    const active = await fetchActiveBroadcasts();
    if (active.length >= 3) {
      Alert.alert(
        "Limit reached",
        "You have 3 active broadcasts — wait for one to expire"
      );
      return;
    }

    setSending(true);
    try {
      const type = customText.trim() ? "custom" : selectedType!;
      await insertBroadcast(
        type,
        duration,
        customText.trim() || undefined
      );
      onBroadcast();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;

  const hasSelection = selectedType !== null || customText.trim().length > 0;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.handle} />
      <View style={styles.body}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Broadcast</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={14} color={theme.muted} strokeWidth={2} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>WHAT ARE YOU UP TO?</Text>

        {/* Preset pills */}
        <View style={styles.presetRow}>
          {presets.map((p) => {
            const Icon = p.icon;
            const active = selectedType === p.type && !customText.trim();
            return (
              <Pressable
                key={p.type}
                style={[styles.preset, active && styles.presetActive]}
                onPress={() => {
                  setSelectedType(p.type);
                  setCustomText("");
                }}
              >
                <Icon
                  size={14}
                  color={active ? "#fff" : theme.muted}
                  strokeWidth={1.75}
                />
                <Text style={[styles.presetText, active && styles.presetTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom input */}
        <View style={styles.customRow}>
          <Pencil size={14} color={theme.muted} strokeWidth={1.75} />
          <TextInput
            style={styles.customInput}
            placeholder="Or type something custom..."
            placeholderTextColor={theme.muted}
            value={customText}
            onChangeText={(t) => {
              setCustomText(t);
              if (t.trim()) setSelectedType(null);
            }}
          />
        </View>

        {/* Duration */}
        <Text style={styles.sectionLabel}>HOW LONG?</Text>
        <View style={styles.durationRow}>
          {durations.map((d) => {
            const active = duration === d.value;
            return (
              <Pressable
                key={d.value}
                style={[styles.durationBtn, active && styles.durationActive]}
                onPress={() => setDuration(d.value)}
              >
                <Text
                  style={[
                    styles.durationText,
                    active && styles.durationTextActive,
                  ]}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Broadcast button */}
        <Pressable
          style={[styles.broadcastBtn, !hasSelection && { opacity: 0.4 }]}
          onPress={handleBroadcast}
          disabled={!hasSelection || sending}
        >
          <Text style={styles.broadcastText}>
            {sending ? "Broadcasting..." : "Broadcast"}
          </Text>
        </Pressable>
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
    zIndex: 35,
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
    paddingTop: 16,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
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
  sectionLabel: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: theme.muted,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  preset: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: theme.border,
  },
  presetActive: {
    backgroundColor: theme.text,
    borderColor: theme.text,
  },
  presetText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
    color: theme.muted,
  },
  presetTextActive: {
    color: "#fff",
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  customInput: {
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    color: theme.text,
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
  },
  durationActive: {
    backgroundColor: "rgba(240,77,44,0.08)",
    borderColor: "rgba(240,77,44,0.3)",
  },
  durationText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
    color: theme.muted,
  },
  durationTextActive: {
    color: theme.accent,
  },
  broadcastBtn: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  broadcastText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 15,
    color: "#fff",
  },
});
