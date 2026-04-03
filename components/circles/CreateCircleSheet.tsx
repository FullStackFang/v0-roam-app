import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  FlatList,
  Alert,
  StyleSheet,
} from "react-native";
import { X, Check } from "lucide-react-native";
import { theme } from "../../constants/theme";
import {
  searchProfiles,
  createCircle,
  addCircleMember,
} from "../../lib/queries";
import type { Profile } from "../../types";

const SHEET_HEIGHT = 440;

interface CreateCircleSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
}

export function CreateCircleSheet({
  visible,
  onClose,
  onCreate,
}: CreateCircleSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      ...theme.spring.bouncy,
    }).start();

    if (visible) {
      setName("");
      setQuery("");
      setResults([]);
      setSelected([]);
    }
  }, [visible]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const profiles = await searchProfiles(query);
      setResults(
        profiles.filter((p) => !selected.some((s) => s.id === p.id))
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selected]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const circle = await createCircle(name.trim());
      for (const member of selected) {
        await addCircleMember(circle.id, member.id);
      }
      onCreate();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setCreating(false);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.handle} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title}>New Circle</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={14} color={theme.muted} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Circle name */}
        <TextInput
          style={styles.nameInput}
          placeholder="Circle name"
          placeholderTextColor={theme.muted}
          value={name}
          onChangeText={setName}
        />

        {/* Selected members */}
        {selected.length > 0 && (
          <View style={styles.selectedRow}>
            {selected.map((p) => (
              <Pressable
                key={p.id}
                style={styles.selectedPill}
                onPress={() =>
                  setSelected((prev) => prev.filter((s) => s.id !== p.id))
                }
              >
                <Text style={styles.selectedName}>{p.display_name}</Text>
                <X size={10} color={theme.muted} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Member search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search people to add..."
          placeholderTextColor={theme.muted}
          value={query}
          onChangeText={setQuery}
        />

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <Pressable
              style={styles.resultRow}
              onPress={() => {
                setSelected((prev) => [...prev, item]);
                setQuery("");
              }}
            >
              <View style={styles.resultAvatar}>
                <Text style={styles.resultAvatarText}>
                  {item.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.resultName}>{item.display_name}</Text>
            </Pressable>
          )}
        />

        {/* Create button */}
        <Pressable
          style={[styles.createBtn, !name.trim() && { opacity: 0.4 }]}
          onPress={handleCreate}
          disabled={!name.trim() || creating}
        >
          <Check size={16} color="#fff" strokeWidth={2} />
          <Text style={styles.createText}>
            {creating ? "Creating..." : "Create Circle"}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  nameInput: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  selectedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedName: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.text,
  },
  searchInput: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  resultsList: {
    maxHeight: 120,
    marginBottom: 14,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  resultAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  resultAvatarText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.muted,
  },
  resultName: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 14,
    color: theme.text,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
  },
  createText: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 15,
    color: "#fff",
  },
});
