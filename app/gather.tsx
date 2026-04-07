import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Send,
  Utensils,
  Wine,
  Footprints,
  Sparkles,
  Coffee,
  Users,
  Globe,
} from "lucide-react-native";
import * as Haptics from "../lib/haptics";
import { createGather, inviteToGather } from "../lib/queries";
import { useBroadcasts } from "../lib/BroadcastsContext";
import { theme } from "../constants/theme";
import { QUICK_ACTION_OPTIONS } from "../types";
import type { StatusType, AudienceType, Circle } from "../types";

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils, Wine, Footprints, Sparkles, Coffee,
};

type Step = "activity" | "details";

export default function GatherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const { circles, refresh } = useBroadcasts();

  // Form state
  const [step, setStep] = useState<Step>("activity");
  const [selectedActivity, setSelectedActivity] = useState<StatusType | null>(null);
  const [title, setTitle] = useState("");
  const [venueName, setVenueName] = useState("");
  const [customText, setCustomText] = useState("");
  const [selectedTime, setSelectedTime] = useState<"now" | "1h" | "2h" | "tonight">("now");
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [sending, setSending] = useState(false);

  const lat = params.lat ? parseFloat(params.lat) : undefined;
  const lng = params.lng ? parseFloat(params.lng) : undefined;

  const handleSelectActivity = useCallback((type: StatusType) => {
    Haptics.selectionAsync();
    setSelectedActivity(type);
    // Auto-fill title from activity
    const opt = QUICK_ACTION_OPTIONS.find((o) => o.type === type);
    if (opt && !title) {
      setTitle(opt.label);
    }
    setStep("details");
  }, [title]);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    if (step === "details") {
      setStep("activity");
    } else {
      router.back();
    }
  }, [step, router]);

  const durationHours = (() => {
    switch (selectedTime) {
      case "now": return 2;
      case "1h": return 3;
      case "2h": return 4;
      case "tonight": {
        const now = new Date();
        const twoAm = new Date(now);
        twoAm.setHours(26, 0, 0, 0); // next day 2am
        return Math.max(2, (twoAm.getTime() - now.getTime()) / (60 * 60 * 1000));
      }
    }
  })();

  const startsAt = (() => {
    if (selectedTime === "now") return undefined;
    const now = new Date();
    if (selectedTime === "1h") return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    if (selectedTime === "2h") return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    // tonight = 7pm if before 7pm, else now
    const sevenPm = new Date(now);
    sevenPm.setHours(19, 0, 0, 0);
    return sevenPm.getTime() > now.getTime() ? sevenPm.toISOString() : undefined;
  })();

  const handleCreate = useCallback(async () => {
    if (!selectedActivity || !title.trim() || sending) return;
    setSending(true);
    try {
      await createGather({
        title: title.trim(),
        statusType: selectedActivity,
        customText: customText.trim() || undefined,
        venueName: venueName.trim() || undefined,
        lat,
        lng,
        startsAt,
        durationHours,
        audienceType: selectedCircle ? "circle" : "everyone",
        audienceCircleId: selectedCircle?.id,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refresh();
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  }, [selectedActivity, title, customText, venueName, lat, lng, startsAt, durationHours, selectedCircle, sending, refresh, router]);

  const canCreate = selectedActivity && title.trim().length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={handleBack} hitSlop={8}>
          {step === "details" ? (
            <ChevronLeft size={22} color={theme.text} strokeWidth={2} />
          ) : (
            <X size={22} color={theme.text} strokeWidth={2} />
          )}
        </Pressable>
        <Text style={styles.headerTitle}>Start a Gather</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === "activity" ? (
          <Animated.View key="activity" entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
            <Text style={styles.stepLabel}>What's the vibe?</Text>
            <View style={styles.activityGrid}>
              {QUICK_ACTION_OPTIONS.map((opt, i) => {
                const Icon = ICON_MAP[opt.iconName];
                const active = selectedActivity === opt.type;
                return (
                  <Animated.View
                    key={opt.type}
                    entering={FadeInDown.delay(60 + i * 60).springify().damping(20).stiffness(200)}
                  >
                    <Pressable
                      style={[styles.activityCard, active && styles.activityCardActive]}
                      onPress={() => handleSelectActivity(opt.type)}
                    >
                      <View style={[styles.activityIcon, active && styles.activityIconActive]}>
                        {Icon && <Icon size={22} color={active ? "#FFFFFF" : theme.accent} strokeWidth={1.75} />}
                      </View>
                      <View style={styles.activityTextWrap}>
                        <Text style={[styles.activityLabel, active && styles.activityLabelActive]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.activityDesc}>{opt.description}</Text>
                      </View>
                      <ChevronRight size={18} color={theme.muted} strokeWidth={2} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        ) : (
          <Animated.View key="details" entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
            {/* Title */}
            <Text style={styles.stepLabel}>Give it a name</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="e.g. Dinner at Collegetown Bagels"
              placeholderTextColor={theme.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={60}
              autoFocus
            />

            {/* Venue */}
            <Text style={styles.fieldLabel}>Where?</Text>
            <View style={styles.fieldRow}>
              <MapPin size={16} color={theme.muted} strokeWidth={1.75} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Place name (optional)"
                placeholderTextColor={theme.muted}
                value={venueName}
                onChangeText={setVenueName}
                maxLength={60}
              />
            </View>

            {/* When */}
            <Text style={styles.fieldLabel}>When?</Text>
            <View style={styles.timePills}>
              {([
                { key: "now", label: "Now" },
                { key: "1h", label: "In 1h" },
                { key: "2h", label: "In 2h" },
                { key: "tonight", label: "Tonight" },
              ] as const).map((t) => {
                const active = selectedTime === t.key;
                return (
                  <Pressable
                    key={t.key}
                    style={[styles.timePill, active && styles.timePillActive]}
                    onPress={() => { Haptics.selectionAsync(); setSelectedTime(t.key); }}
                  >
                    <Text style={[styles.timePillText, active && styles.timePillTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Note */}
            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add context... (optional)"
              placeholderTextColor={theme.muted}
              value={customText}
              onChangeText={setCustomText}
              maxLength={120}
              multiline
            />

            {/* Audience */}
            {circles.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Who can see this?</Text>
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
              </>
            )}

            {/* Create button */}
            <Pressable
              style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={!canCreate || sending}
            >
              <Send size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.createBtnText}>
                {sending ? "Creating..." : "Start Gather"}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: theme.fonts.headingHeavy,
    fontSize: 20,
    color: theme.text,
    flex: 1,
    textAlign: "center",
  },
  content: {
    padding: 20,
  },

  // Step labels
  stepLabel: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: theme.text,
    marginBottom: 16,
  },

  // Activity grid (step 1)
  activityGrid: {
    gap: 10,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
    boxShadow: theme.shadow.card,
  } as any,
  activityCardActive: {
    borderWidth: 2,
    borderColor: theme.accent,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accentFill,
    alignItems: "center",
    justifyContent: "center",
  },
  activityIconActive: {
    backgroundColor: theme.accent,
  },
  activityTextWrap: {
    flex: 1,
    gap: 2,
  },
  activityLabel: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: theme.text,
  },
  activityLabelActive: {
    color: theme.accent,
  },
  activityDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
  },

  // Details (step 2)
  titleInput: {
    height: 48,
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: theme.text,
    marginBottom: 20,
    boxShadow: theme.shadow.card,
  } as any,
  fieldLabel: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 13,
    color: theme.muted,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    marginBottom: 20,
  } as any,
  fieldInput: {
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    color: theme.text,
  },

  // Time pills
  timePills: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  timePill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    backgroundColor: theme.surface,
  } as any,
  timePillActive: {
    backgroundColor: theme.warm,
  },
  timePillText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 13,
    color: theme.text,
  },
  timePillTextActive: {
    color: "#FFFFFF",
  },

  // Note
  noteInput: {
    minHeight: 60,
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    color: theme.text,
    textAlignVertical: "top",
    marginBottom: 20,
  } as any,

  // Audience
  audienceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  audiencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    backgroundColor: theme.surface,
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

  // Create button
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    backgroundColor: theme.warm,
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    marginTop: 8,
  } as any,
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
