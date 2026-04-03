import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
} from "react-native";
import {
  Flame,
  Moon,
  ThumbsDown,
  Utensils,
  Calendar,
  Dumbbell,
  Trees,
  BookOpen,
  X,
} from "lucide-react-native";
import { theme } from "../../constants/theme";
import { confirmVibe, reportVibe } from "../../lib/queries";
import type { Venue, Checkin, VibeType } from "../../types";

const CARD_HEIGHT = 420;

interface SpotCardProps {
  venue: Venue | null;
  checkin: Checkin | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}

const categoryConfig: Record<
  string,
  { icon: React.ElementType; label: string }
> = {
  eatdrink: { icon: Utensils, label: "Eat & Drink" },
  happening: { icon: Calendar, label: "Happening" },
  move: { icon: Dumbbell, label: "Move" },
  outside: { icon: Trees, label: "Outside" },
  focus: { icon: BookOpen, label: "Focus" },
};

const vibeConfig: Record<
  VibeType,
  { icon: React.ElementType; label: string; vibeText: string }
> = {
  buzzing: { icon: Flame, label: "Buzzing", vibeText: "Buzzing right now" },
  quiet: { icon: Moon, label: "Quiet", vibeText: "Quiet right now" },
  skip: {
    icon: ThumbsDown,
    label: "Skip it",
    vibeText: "Not worth it tonight",
  },
};

export function SpotCard({ venue, checkin, onClose, onToast }: SpotCardProps) {
  const translateY = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const [decayWidth, setDecayWidth] = React.useState(75);
  const [confirmDimmed, setConfirmDimmed] = React.useState(false);
  const [selectedVibe, setSelectedVibe] = React.useState<VibeType | null>(null);
  const [currentVibeText, setCurrentVibeText] = React.useState("");

  const isOpen = venue !== null;

  useEffect(() => {
    if (isOpen && checkin) {
      const created = new Date(checkin.created_at).getTime();
      const expires = new Date(checkin.expires_at).getTime();
      const now = Date.now();
      const total = expires - created;
      const remaining = Math.max(0, expires - now);
      setDecayWidth(Math.round((remaining / total) * 100));
      setConfirmDimmed(false);
      setSelectedVibe(null);
      setCurrentVibeText(
        vibeConfig[checkin.vibe]?.vibeText ?? "Active right now"
      );
    }

    Animated.spring(translateY, {
      toValue: isOpen ? 0 : CARD_HEIGHT,
      ...theme.spring.bouncy,
    }).start();
  }, [isOpen, venue?.id]);

  if (!venue) return null;

  const cat = categoryConfig[venue.category] ?? categoryConfig.eatdrink;
  const CatIcon = cat.icon;

  const confirmWord =
    checkin?.vibe === "buzzing"
      ? "buzzing"
      : checkin?.vibe === "quiet"
        ? "quiet"
        : "this";

  const handleConfirm = async (yes: boolean) => {
    if (checkin) {
      try {
        await confirmVibe(checkin.id, yes);
      } catch {
        // Offline or not authed
      }
    }
    if (yes) {
      setDecayWidth(100);
      setConfirmDimmed(true);
      onToast("Confirmed — thanks for keeping it real");
    } else {
      onToast("Got it — report the new vibe below");
    }
  };

  const handleReportVibe = async (vibe: VibeType) => {
    setSelectedVibe(vibe);
    setCurrentVibeText(vibeConfig[vibe].vibeText);
    setDecayWidth(100);
    setConfirmDimmed(true);

    if (checkin) {
      try {
        await reportVibe(checkin.id, vibe);
      } catch {
        // Offline or not authed
      }
    }

    const messages: Record<VibeType, string> = {
      buzzing: "Reported buzzing — others will see this",
      quiet: "Reported quiet",
      skip: "Flagged — appreciated",
    };
    onToast(messages[vibe]);
  };

  const getDecayTimeLabel = () => {
    if (!checkin) return "";
    const diff = Date.now() - new Date(checkin.created_at).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    const remainingMin = minutes % 60;
    return remainingMin > 0
      ? `${hours}h ${remainingMin}min ago`
      : `${hours}h ago`;
  };

  const peopleCount = checkin
    ? Math.max(1, Math.round(checkin.activity_score * 20))
    : 3;
  const avatars = ["A", "B", "C", "D"].slice(
    0,
    Math.min(4, Math.ceil(peopleCount / 4))
  );

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.handle} />
      <View style={styles.body}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{venue.name}</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={14} color={theme.muted} strokeWidth={2} />
          </Pressable>
        </View>

        <Text style={styles.neighborhood}>
          {venue.neighborhood.toUpperCase()}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.categoryPill}>
            <CatIcon size={12} color={theme.muted} strokeWidth={1.75} />
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </View>
          <View style={styles.liveVibe}>
            <View style={styles.liveDot} />
            <Text style={styles.liveVibeText}>{currentVibeText}</Text>
          </View>
        </View>

        {/* Decay bar */}
        <View style={styles.decayWrap}>
          <View style={styles.decayMeta}>
            <Text style={styles.decayLabel}>Vibe freshness</Text>
            <Text style={styles.decayLabel}>{getDecayTimeLabel()}</Text>
          </View>
          <View style={styles.decayTrack}>
            <View style={[styles.decayFill, { width: `${decayWidth}%` }]} />
          </View>
        </View>

        {/* Confirm row */}
        <View style={[styles.confirmRow, confirmDimmed && { opacity: 0.35 }]}>
          <Text style={styles.confirmLabel}>
            Still <Text style={styles.confirmWord}>{confirmWord}</Text>?
          </Text>
          <View style={styles.confirmBtns}>
            <Pressable
              style={({ pressed }) => [
                styles.confirmYes,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
              onPress={() => handleConfirm(true)}
            >
              <Text style={styles.confirmYesText}>Still true</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmNo,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
              onPress={() => handleConfirm(false)}
            >
              <Text style={styles.confirmNoText}>Not anymore</Text>
            </Pressable>
          </View>
        </View>

        {/* Report vibe */}
        <Text style={styles.reportLabel}>REPORT VIBE</Text>
        <View style={styles.vibeRow}>
          {(["buzzing", "quiet", "skip"] as VibeType[]).map((vibe) => {
            const config = vibeConfig[vibe];
            const Icon = config.icon;
            const isSelected = selectedVibe === vibe;
            return (
              <Pressable
                key={vibe}
                style={({ pressed }) => [
                  styles.vibeBtn,
                  isSelected && vibe === "buzzing" && styles.vibeBuzzingSel,
                  isSelected && vibe === "quiet" && styles.vibeQuietSel,
                  isSelected && vibe === "skip" && styles.vibeSkipSel,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
                onPress={() => handleReportVibe(vibe)}
              >
                <Icon
                  size={16}
                  color={
                    isSelected
                      ? vibe === "buzzing"
                        ? theme.accent
                        : vibe === "quiet"
                          ? theme.cool
                          : theme.text
                      : theme.muted
                  }
                  strokeWidth={1.75}
                />
                <Text
                  style={[
                    styles.vibeBtnText,
                    isSelected && vibe === "buzzing" && { color: theme.accent },
                    isSelected && vibe === "quiet" && { color: theme.cool },
                    isSelected && vibe === "skip" && { color: theme.text },
                  ]}
                >
                  {config.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* People row */}
        <View style={styles.peopleRow}>
          <View style={styles.avatarStack}>
            {avatars.map((a, i) => (
              <View
                key={i}
                style={[styles.avatar, i > 0 && { marginLeft: -6 }]}
              >
                <Text style={styles.avatarText}>{a}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.peopleLabel}>{peopleCount} active here</Text>
        </View>
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
    zIndex: 30,
    backgroundColor: theme.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    // Tinted shadow instead of pure black
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
    paddingTop: 18,
    paddingHorizontal: 22,
    paddingBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  name: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    flex: 1,
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
    marginLeft: 12,
    marginTop: 2,
  },
  neighborhood: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.3,
    color: theme.muted,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.lg,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  categoryLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    color: theme.muted,
  },
  liveVibe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(240,77,44,0.06)",
    borderWidth: 1,
    borderColor: "rgba(240,77,44,0.15)",
    borderRadius: theme.radius.lg,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.accent,
  },
  liveVibeText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11.5,
    color: theme.accent,
  },
  decayWrap: {
    marginBottom: 14,
  },
  decayMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  decayLabel: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    color: theme.muted,
  },
  decayTrack: {
    height: 3,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 2,
    overflow: "hidden",
  },
  decayFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: theme.green,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.015)",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  confirmLabel: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
    flex: 1,
  },
  confirmWord: {
    fontFamily: theme.fonts.sansMedium,
    color: theme.text,
  },
  confirmBtns: {
    flexDirection: "row",
    gap: 7,
    marginLeft: 10,
  },
  confirmYes: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(56,160,122,0.10)",
    borderWidth: 1,
    borderColor: "rgba(56,160,122,0.25)",
  },
  confirmYesText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.green,
  },
  confirmNo: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  confirmNoText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
  },
  reportLabel: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: theme.muted,
    marginBottom: 9,
  },
  vibeRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 14,
  },
  vibeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: "rgba(0,0,0,0.015)",
    alignItems: "center",
    gap: 5,
  },
  vibeBtnText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11.5,
    color: theme.muted,
    textAlign: "center",
  },
  vibeBuzzingSel: {
    backgroundColor: "rgba(240,77,44,0.10)",
    borderColor: "rgba(240,77,44,0.35)",
  },
  vibeQuietSel: {
    backgroundColor: "rgba(74,158,158,0.10)",
    borderColor: "rgba(74,158,158,0.30)",
  },
  vibeSkipSel: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderColor: "rgba(0,0,0,0.15)",
  },
  peopleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  avatarStack: {
    flexDirection: "row",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.surface,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 10,
    color: theme.muted,
  },
  peopleLabel: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.muted,
  },
});
