import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { FeedList } from "../../components/feed/FeedList";
import { CircleFilterBar } from "../../components/feed/CircleFilterBar";
import { PosturePicker } from "../../components/feed/PosturePicker";
import { CreateCircleSheet } from "../../components/circles/CreateCircleSheet";
import { fetchCircles, expressInterest } from "../../lib/queries";
import type { Circle, PostureType } from "../../types";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circleFilter, setCircleFilter] = useState<string | null>(null);
  const [postureActivityId, setPostureActivityId] = useState<string | null>(null);
  const [createCircleOpen, setCreateCircleOpen] = useState(false);

  const loadCircles = useCallback(async () => {
    try {
      const data = await fetchCircles();
      setCircles(data);
    } catch {
      // Circles not available yet — empty is fine
    }
  }, []);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  const handleJoinActivity = (activityId: string) => {
    setPostureActivityId(activityId);
  };

  const handlePostureSelect = async (posture: PostureType) => {
    if (!postureActivityId) return;
    try {
      await expressInterest(postureActivityId, posture);
    } catch {
      // silently fail — offline or already expressed
    }
    setPostureActivityId(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
        <Pressable
          style={styles.addCircleBtn}
          onPress={() => setCreateCircleOpen(true)}
        >
          <Plus size={16} color={theme.muted} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Circle filter */}
      <CircleFilterBar
        circles={circles}
        selected={circleFilter}
        onSelect={setCircleFilter}
      />

      {/* Feed cards */}
      <FeedList
        circleFilter={circleFilter}
        onJoinActivity={handleJoinActivity}
      />

      {/* Posture picker overlay */}
      <PosturePicker
        visible={postureActivityId !== null}
        onSelect={handlePostureSelect}
        onClose={() => setPostureActivityId(null)}
      />

      {/* Create circle sheet */}
      <CreateCircleSheet
        visible={createCircleOpen}
        onClose={() => setCreateCircleOpen(false)}
        onCreate={loadCircles}
      />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 28,
    color: theme.text,
    letterSpacing: -0.5,
  },
  addCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
