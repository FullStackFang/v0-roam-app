import React, { useState, useEffect, useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import { FeedCard } from "./FeedCard";
import { FeedEmpty, FeedError, FeedSkeleton } from "./FeedEmpty";
import { fetchFeedData } from "../../lib/queries";
import { theme } from "../../constants/theme";
import type { FeedItem } from "../../types";

export function FeedList() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(false);
      const data = await fetchFeedData();
      setItems(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) return <FeedSkeleton />;
  if (error) return <FeedError onRetry={loadData} />;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => `${item.type}-${item.data.id}`}
      renderItem={({ item }) => <FeedCard item={item} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={FeedEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.accent}
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
