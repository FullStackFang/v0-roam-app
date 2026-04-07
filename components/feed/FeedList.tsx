import React, { useState, useCallback, useMemo } from "react";
import { SectionList, RefreshControl, StyleSheet } from "react-native";
import { FeedCard } from "./FeedCard";
import { BucketHeader } from "./BucketHeader";
import { FeedEmpty, FeedError, FeedSkeleton } from "./FeedEmpty";
import { BUCKET_ORDER } from "../../lib/queries";
import { useBroadcasts } from "../../lib/BroadcastsContext";
import { theme } from "../../constants/theme";
import { BUCKET_LABELS, type FeedItem, type FeedBucket } from "../../types";

interface FeedSection {
  bucket: FeedBucket;
  title: string;
  data: FeedItem[];
}

function groupByBucket(items: FeedItem[]): FeedSection[] {
  const buckets = BUCKET_ORDER;
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
  const { feedItems, currentUserId, loading, error, refresh } = useBroadcasts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <FeedCard item={item} currentUserId={currentUserId} />
    ),
    [currentUserId]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: FeedSection }) => (
      <BucketHeader title={section.title} />
    ),
    []
  );

  if (loading) return <FeedSkeleton />;
  if (error) return <FeedError onRetry={refresh} />;

  const sections = groupByBucket(feedItems);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.type}-${item.data.id}`}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
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
