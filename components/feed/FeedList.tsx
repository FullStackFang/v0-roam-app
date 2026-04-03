import React, { useState, useEffect, useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import { FeedCard } from "./FeedCard";
import { fetchFeedData } from "../../lib/queries";
import { theme } from "../../constants/theme";
import type { FeedItem } from "../../types";

interface FeedListProps {
  circleFilter: string | null;
  onJoinActivity: (activityId: string) => void;
}

export function FeedList({ circleFilter, onJoinActivity }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchFeedData();
      // Filter by circle if selected
      if (circleFilter) {
        setItems(
          data.filter((item) => {
            if (item.type === "activity" && item.data.circle_id === circleFilter)
              return true;
            // Broadcasts don't have circle_id — show all for now
            // (will be filtered by circle membership server-side in future)
            if (item.type === "broadcast") return true;
            return false;
          })
        );
      } else {
        setItems(data);
      }
    } catch (err) {
      console.warn("Error loading feed:", err);
    }
  }, [circleFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getKey = (item: FeedItem) => {
    return `${item.type}-${item.data.id}`;
  };

  return (
    <FlatList
      data={items}
      keyExtractor={getKey}
      renderItem={({ item }) => (
        <FeedCard item={item} onJoinActivity={onJoinActivity} />
      )}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.muted}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
});
