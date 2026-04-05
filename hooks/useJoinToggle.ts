import { useState, useCallback, useEffect } from "react";
import { joinBroadcast, leaveBroadcast } from "../lib/queries";
import type { BroadcastJoin } from "../types";

interface UseJoinToggleResult {
  hasJoined: boolean;
  joinLoading: boolean;
  joinCount: number;
  handleJoinToggle: () => void;
}

export function useJoinToggle(
  broadcastId: string,
  currentUserId: string | null,
  isMine: boolean,
  joins: BroadcastJoin[],
  baseJoinCount: number
): UseJoinToggleResult {
  const [joinLoading, setJoinLoading] = useState(false);
  const [optimisticJoined, setOptimisticJoined] = useState<boolean | null>(null);

  const hasJoined = optimisticJoined ?? joins.some((j) => j.user_id === currentUserId);
  const joinCount =
    optimisticJoined !== null
      ? baseJoinCount + (optimisticJoined ? 1 : -1)
      : baseJoinCount;

  // Reset optimistic state when server data changes
  useEffect(() => {
    setOptimisticJoined(null);
  }, [joins.length]);

  const handleJoinToggle = useCallback(async () => {
    if (!currentUserId || isMine) return;
    setJoinLoading(true);
    const willJoin = !hasJoined;
    setOptimisticJoined(willJoin);
    try {
      if (willJoin) {
        await joinBroadcast(broadcastId);
      } else {
        await leaveBroadcast(broadcastId);
      }
    } catch {
      setOptimisticJoined(null);
    } finally {
      setJoinLoading(false);
    }
  }, [currentUserId, isMine, hasJoined, broadcastId]);

  return { hasJoined, joinLoading, joinCount, handleJoinToggle };
}
