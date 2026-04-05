import React, { useState, useEffect, useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import { FeedCard } from "./FeedCard";
import { fetchFeedData } from "../../lib/queries";
import { theme } from "../../constants/theme";
import type { FeedItem } from "../../types";

export function FeedList() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchFeedData();
      setItems(data);
    } catch (err) {
      console.warn("Error loading feed:", err);
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

  const getKey = (item: FeedItem) => {
    return `${item.type}-${item.data.id}`;
  };

  return (
    <FlatList
      data={items}
      keyExtractor={getKey}
      renderItem={({ item }) => <FeedCard item={item} />}
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
