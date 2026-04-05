import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SectionList, RefreshControl, StyleSheet } from "react-native";
import { FeedCard } from "./FeedCard";
import { BucketHeader } from "./BucketHeader";
import { FeedEmpty, FeedError, FeedSkeleton } from "./FeedEmpty";
import { fetchFeedData } from "../../lib/queries";
import { supabase } from "../../lib/supabase";
import { debounce } from "../../lib/debounce";
import { theme } from "../../constants/theme";
import { BUCKET_LABELS, type FeedItem, type FeedBucket } from "../../types";

interface FeedSection {
  bucket: FeedBucket;
  title: string;
  data: FeedItem[];
}

function groupByBucket(items: FeedItem[]): FeedSection[] {
  const buckets: FeedBucket[] = ["happening_now", "later_today", "tonight"];
  const sections: FeedSection[] = [];

  for (const bucket of buckets) {
    const data = items.filter((i) => i.bucket === bucket);
    if (data.length > 0) {
      sections.push({ bucket, title: BUCKET_LABELS[bucket], data });
    }
  }

  return sections;
}

export function FeedList() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  const debouncedLoad = useMemo(() => debounce(loadData, 500), [loadData]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });

    loadData();

    const broadcastChannel = supabase
      .channel("feed-broadcasts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "status_broadcasts" },
        () => debouncedLoad()
      )
      .subscribe();

    const joinChannel = supabase
      .channel("feed-joins")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "broadcast_joins" },
        () => debouncedLoad()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(joinChannel);
    };
  }, [loadData, debouncedLoad]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) return <FeedSkeleton />;
  if (error) return <FeedError onRetry={loadData} />;

  const sections = groupByBucket(items);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.type}-${item.data.id}`}
      renderItem={({ item }) => (
        <FeedCard item={item} currentUserId={currentUserId} />
      )}
      renderSectionHeader={({ section }) => (
        <BucketHeader title={section.title} />
      )}
      contentContainerStyle={styles.list}
      ListEmptyComponent={FeedEmpty}
      stickySectionHeadersEnabled={false}
      maxToRenderPerBatch={8}
      windowSize={5}
      initialNumToRender={6}
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
