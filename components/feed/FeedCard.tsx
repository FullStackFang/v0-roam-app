import React from "react";
import { BroadcastCard } from "./BroadcastCard";
import { MomentCard } from "./MomentCard";
import { GatherCard } from "./GatherCard";
import type { FeedItem } from "../../types";

interface FeedCardProps {
  item: FeedItem;
  currentUserId: string | null;
}

export function FeedCard({ item, currentUserId }: FeedCardProps): React.ReactElement {
  switch (item.type) {
    case "broadcast":
      return <BroadcastCard broadcast={item.data} currentUserId={currentUserId} />;
    case "moment":
      return <MomentCard moment={item.data} currentUserId={currentUserId} />;
    case "gather":
      return <GatherCard gather={item.data} currentUserId={currentUserId} />;
  }
}
