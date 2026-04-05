import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, LogOut, Check } from "lucide-react-native";
import * as Haptics from "../lib/haptics";
import { supabase } from "../lib/supabase";
import { fetchProfile, upsertProfile } from "../lib/queries";
import { theme, avatarColor } from "../constants/theme";
import type { Profile } from "../types";
import { format } from "date-fns";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const p = await fetchProfile(user.id);
      if (p) {
        setProfile(p);
        setDisplayName(p.display_name);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      const updated = await upsertProfile({ display_name: displayName.trim() });
      setProfile(updated);
      setIsDirty(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  }, [displayName, isDirty, saving]);

  const handleSignOut = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await supabase.auth.signOut();
  }, []);

  const initial = profile?.display_name?.charAt(0).toUpperCase() ?? "?";
  const bgColor = profile ? avatarColor(profile.id) : theme.muted;
  const memberSince = profile
    ? format(new Date(profile.created_at), "MMMM yyyy")
    : "";

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="small" color={theme.muted} style={{ marginTop: 80 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeBtn}
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          hitSlop={8}
        >
          <X size={22} color={theme.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.closeBtn} />
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: bgColor }]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      </View>

      {/* Fields */}
      <View style={styles.fields}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                setIsDirty(text.trim() !== profile?.display_name);
              }}
              placeholder="Your name"
              placeholderTextColor={theme.muted}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            {isDirty && (
              <Pressable
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={theme.surface} />
                ) : (
                  <Check size={16} color={theme.surface} strokeWidth={2.5} />
                )}
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <Text style={styles.fieldValue}>{profile?.university_email ?? ""}</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>MEMBER SINCE</Text>
          <Text style={styles.fieldValue}>{memberSince}</Text>
        </View>
      </View>

      {/* Sign out */}
      <View style={styles.footer}>
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut size={18} color={theme.error} strokeWidth={1.75} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: theme.fonts.serifBold,
    fontSize: 20,
    color: theme.text,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 28,
    color: theme.warmWhite,
  },
  fields: {
    paddingHorizontal: 24,
    gap: 24,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: theme.muted,
  },
  fieldValue: {
    fontFamily: theme.fonts.sans,
    fontSize: 16,
    color: theme.text,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameInput: {
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 16,
    color: theme.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingVertical: 6,
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    backgroundColor: theme.errorTint,
  } as any,
  signOutText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 15,
    color: theme.error,
  },
});
