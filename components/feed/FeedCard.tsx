import React from "react";
import { BroadcastCard } from "./BroadcastCard";
import type { FeedItem } from "../../types";

interface FeedCardProps {
  item: FeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  switch (item.type) {
    case "broadcast":
      return <BroadcastCard broadcast={item.data} />;
  }
}
