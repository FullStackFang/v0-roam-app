import React from "react";
import { BroadcastCard } from "./BroadcastCard";
import { ActivityCard } from "./ActivityCard";
import { VenueCard } from "./VenueCard";
import type { FeedItem } from "../../types";

interface FeedCardProps {
  item: FeedItem;
  onJoinActivity?: (activityId: string) => void;
}

export function FeedCard({ item, onJoinActivity }: FeedCardProps) {
  switch (item.type) {
    case "broadcast":
      return <BroadcastCard broadcast={item.data} />;
    case "activity":
      return (
        <ActivityCard
          activity={item.data}
          onJoin={() => onJoinActivity?.(item.data.id)}
        />
      );
    case "venue":
      return <VenueCard venue={item.data} />;
  }
}
