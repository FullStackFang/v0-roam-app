import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  Plus,
  Users,
  ChevronRight,
  Trash2,
  LogOut,
  UserPlus,
  Search,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp, FadeOut } from "react-native-reanimated";
import * as Haptics from "../lib/haptics";
import { supabase } from "../lib/supabase";
import {
  fetchMyCircles,
  createCircle,
  fetchCircleMembers,
  addCircleMember,
  leaveCircle,
  deleteCircle,
  searchProfiles,
} from "../lib/queries";
import { theme, avatarColor } from "../constants/theme";
import type { Circle, CircleMember, Profile } from "../types";

export default function CirclesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Create circle state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Detail state
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Add member search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      try {
        const data = await fetchMyCircles();
        setCircles(data);
      } catch {
        // Circles will show empty state
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const circle = await createCircle(name);
      setCircles((prev) => [circle, ...prev]);
      setNewName("");
      setShowCreate(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCreating(false);
    }
  }, [newName, creating]);

  const handleSelectCircle = useCallback(async (circle: Circle) => {
    Haptics.selectionAsync();
    setSelectedCircle(circle);
    setMembers([]);
    setMembersLoading(true);
    setSearchQuery("");
    setSearchResults([]);
    try {
      const data = await fetchCircleMembers(circle.id);
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const capturedQuery = query;
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchProfiles(capturedQuery);
      // Guard against stale results if query changed during fetch
      setSearchQuery((current) => {
        if (current === capturedQuery) {
          const memberIds = new Set(members.map((m) => m.user_id));
          setSearchResults(results.filter((p) => !memberIds.has(p.id)));
        }
        return current;
      });
    }, 300);
  }, [members]);

  const handleAddMember = useCallback(async (profile: Profile) => {
    if (!selectedCircle) return;
    Haptics.selectionAsync();
    try {
      await addCircleMember(selectedCircle.id, profile.id);
      setMembers((prev) => [
        ...prev,
        { id: "", circle_id: selectedCircle.id, user_id: profile.id, joined_at: new Date().toISOString(), profile },
      ]);
      setSearchQuery("");
      setSearchResults([]);
      setCircles((prev) =>
        prev.map((c) =>
          c.id === selectedCircle.id ? { ...c, member_count: (c.member_count ?? 0) + 1 } : c
        )
      );
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [selectedCircle]);

  const clearDetailState = useCallback(() => {
    setSelectedCircle(null);
    setMembers([]);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    clearDetailState();
  }, [clearDetailState]);

  const handleLeave = useCallback(async () => {
    if (!selectedCircle) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await leaveCircle(selectedCircle.id);
      setCircles((prev) => prev.filter((c) => c.id !== selectedCircle.id));
      clearDetailState();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [selectedCircle, clearDetailState]);

  const handleDelete = useCallback(async () => {
    if (!selectedCircle) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await deleteCircle(selectedCircle.id);
      setCircles((prev) => prev.filter((c) => c.id !== selectedCircle.id));
      clearDetailState();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [selectedCircle, clearDetailState]);

  const isCreator = selectedCircle?.created_by === userId;

  // ── Detail View ─────────────────────────────────────────

  if (selectedCircle) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={handleBack} hitSlop={8}>
            <X size={22} color={theme.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{selectedCircle.name}</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.searchRow}>
          <Search size={16} color={theme.muted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Add someone..."
            placeholderTextColor={theme.muted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
        </View>

        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((p) => (
              <Pressable key={p.id} style={styles.searchResultRow} onPress={() => handleAddMember(p)}>
                <View style={[styles.miniAvatar, { backgroundColor: avatarColor(p.id) }]}>
                  <Text style={styles.miniAvatarText}>{p.display_name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.searchResultName} numberOfLines={1}>{p.display_name}</Text>
                <UserPlus size={16} color={theme.accent} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        )}

        {membersLoading ? (
          <ActivityIndicator size="small" color={theme.muted} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={members}
            keyExtractor={(m) => m.user_id}
            contentContainerStyle={styles.memberList}
            renderItem={({ item }) => (
              <View style={styles.memberRow}>
                <View style={[styles.miniAvatar, { backgroundColor: avatarColor(item.user_id) }]}>
                  <Text style={styles.miniAvatarText}>
                    {item.profile?.display_name?.charAt(0).toUpperCase() ?? "?"}
                  </Text>
                </View>
                <Text style={styles.memberName} numberOfLines={1}>
                  {item.profile?.display_name ?? "Unknown"}
                </Text>
                {item.user_id === selectedCircle.created_by && (
                  <Text style={styles.creatorBadge}>Creator</Text>
                )}
              </View>
            )}
            ListHeaderComponent={
              <Text style={styles.sectionLabel}>{members.length} MEMBERS</Text>
            }
          />
        )}

        <View style={[styles.detailFooter, { paddingBottom: insets.bottom + 16 }]}>
          {isCreator ? (
            <Pressable style={styles.dangerBtn} onPress={handleDelete}>
              <Trash2 size={16} color={theme.error} strokeWidth={1.75} />
              <Text style={styles.dangerText}>Delete circle</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.dangerBtn} onPress={handleLeave}>
              <LogOut size={16} color={theme.error} strokeWidth={1.75} />
              <Text style={styles.dangerText}>Leave circle</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // ── List View ───────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          hitSlop={8}
        >
          <X size={22} color={theme.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>My Circles</Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => { Haptics.selectionAsync(); setShowCreate(true); }}
          hitSlop={8}
        >
          <Plus size={22} color={theme.accent} strokeWidth={2} />
        </Pressable>
      </View>

      {showCreate && (
        <Animated.View
          entering={FadeInDown.springify().damping(20).stiffness(200)}
          exiting={FadeOut.duration(150)}
          style={styles.createRow}
        >
          <TextInput
            style={styles.createInput}
            placeholder="Circle name..."
            placeholderTextColor={theme.muted}
            value={newName}
            onChangeText={setNewName}
            autoFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <Pressable
            style={[styles.createBtn, !newName.trim() && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!newName.trim() || creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color={theme.surface} />
            ) : (
              <Plus size={18} color={theme.surface} strokeWidth={2.5} />
            )}
          </Pressable>
        </Animated.View>
      )}

      {loading ? (
        <ActivityIndicator size="small" color={theme.muted} style={{ marginTop: 40 }} />
      ) : circles.length === 0 ? (
        <View style={styles.empty}>
          <Users size={40} color={theme.muted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No circles yet</Text>
          <Text style={styles.emptyDesc}>
            Create a circle to group your friends
          </Text>
        </View>
      ) : (
        <FlatList
          data={circles}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 60).springify().damping(20).stiffness(200)}>
              <Pressable style={styles.circleCard} onPress={() => handleSelectCircle(item)}>
                <View style={styles.circleIcon}>
                  <Users size={20} color={theme.accent} strokeWidth={1.75} />
                </View>
                <View style={styles.circleInfo}>
                  <Text style={styles.circleName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.circleMeta}>
                    {item.member_count ?? 0} {(item.member_count ?? 0) === 1 ? "member" : "members"}
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.muted} strokeWidth={2} />
              </Pressable>
            </Animated.View>
          )}
        />
      )}
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

  // Create
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  createInput: {
    flex: 1,
    height: 42,
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    color: theme.text,
  } as any,
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnDisabled: {
    opacity: 0.4,
  },

  // List
  list: {
    padding: 16,
    gap: 10,
  },
  circleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    padding: 16,
    gap: 14,
    boxShadow: theme.shadow.card,
  } as any,
  circleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accentFill,
    alignItems: "center",
    justifyContent: "center",
  },
  circleInfo: {
    flex: 1,
    gap: 2,
  },
  circleName: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 16,
    color: theme.text,
  },
  circleMeta: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
  },

  // Empty
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: theme.text,
  },
  emptyDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    color: theme.muted,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // Detail — search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    height: 42,
    backgroundColor: theme.surface,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 12,
  } as any,
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    color: theme.text,
  },
  searchResults: {
    marginHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: theme.radius.sm,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  } as any,
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  searchResultName: {
    flex: 1,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 14,
    color: theme.text,
  },

  // Detail — members
  memberList: {
    padding: 16,
    gap: 2,
  },
  sectionLabel: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: theme.muted,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarText: {
    fontFamily: theme.fonts.sansBold,
    fontSize: 13,
    color: "#fff",
  },
  memberName: {
    flex: 1,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 15,
    color: theme.text,
  },
  creatorBadge: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 11,
    color: theme.accent,
    backgroundColor: theme.accentFill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    overflow: "hidden",
  },

  // Detail — footer
  detailFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    backgroundColor: theme.errorTint,
  } as any,
  dangerText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 15,
    color: theme.error,
  },
});
