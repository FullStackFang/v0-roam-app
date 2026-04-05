import React from "react";
import { BroadcastCard } from "./BroadcastCard";
import type { FeedItem } from "../../types";

interface FeedCardProps {
  item: FeedItem;
  currentUserId: string | null;
}

export function FeedCard({ item, currentUserId }: FeedCardProps): React.ReactElement {
  switch (item.type) {
    case "broadcast":
      return <BroadcastCard broadcast={item.data} currentUserId={currentUserId} />;
  }
}
