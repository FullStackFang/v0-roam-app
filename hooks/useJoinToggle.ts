import { useState, useCallback, useEffect } from "react";
import { joinBroadcast, leaveBroadcast } from "../lib/queries";
import type { BroadcastJoin, JoinType } from "../types";

/** "none" → on_my_way → joined → leave (none) */
type JoinState = "none" | "on_my_way" | "joined";

export type JoinButtonState = "default" | "on_my_way" | "joined";

interface JoinButtonProps {
  state: JoinButtonState;
  loading: boolean;
  onPress: () => void;
}

interface UseJoinToggleResult {
  joinState: JoinState;
  joinLoading: boolean;
  joinCount: number;
  omwCount: number;
  joinButtonProps: JoinButtonProps;
}

export function useJoinToggle(
  broadcastId: string,
  currentUserId: string | null,
  isMine: boolean,
  joins: BroadcastJoin[],
  baseJoinCount: number
): UseJoinToggleResult {
  const [joinLoading, setJoinLoading] = useState(false);
  const [optimisticState, setOptimisticState] = useState<JoinState | null>(null);

  // Derive server state
  const myJoin = joins.find((j) => j.user_id === currentUserId);
  const serverState: JoinState = myJoin
    ? (myJoin.join_type === "on_my_way" ? "on_my_way" : "joined")
    : "none";

  const joinState = optimisticState ?? serverState;

  const serverOmwCount = joins.filter((j) => j.join_type === "on_my_way").length;

  // Adjust counts based on optimistic state
  let joinCount = baseJoinCount;
  let omwCount = serverOmwCount;

  if (optimisticState !== null && optimisticState !== serverState) {
    if (serverState === "none" && optimisticState === "on_my_way") {
      omwCount += 1;
      joinCount += 1;
    } else if (serverState === "none" && optimisticState === "joined") {
      joinCount += 1;
    } else if (serverState === "on_my_way" && optimisticState === "joined") {
      omwCount -= 1;
    } else if ((serverState === "on_my_way" || serverState === "joined") && optimisticState === "none") {
      joinCount -= 1;
      if (serverState === "on_my_way") omwCount -= 1;
    }
  }

  // Reset optimistic state when server data changes
  const joinsKey = joins.map((j) => `${j.user_id}:${j.join_type}`).join(",");
  useEffect(() => {
    setOptimisticState(null);
  }, [joinsKey]);

  const handleOmw = useCallback(async () => {
    if (!currentUserId || isMine || joinLoading) return;
    setJoinLoading(true);
    setOptimisticState("on_my_way");
    try {
      await joinBroadcast(broadcastId, "on_my_way");
    } catch {
      setOptimisticState(null);
    } finally {
      setJoinLoading(false);
    }
  }, [currentUserId, isMine, joinLoading, broadcastId]);

  const handleJoin = useCallback(async () => {
    if (!currentUserId || isMine || joinLoading) return;
    setJoinLoading(true);
    setOptimisticState("joined");
    try {
      await joinBroadcast(broadcastId, "joined");
    } catch {
      setOptimisticState(null);
    } finally {
      setJoinLoading(false);
    }
  }, [currentUserId, isMine, joinLoading, broadcastId]);

  const handleLeave = useCallback(async () => {
    if (!currentUserId || isMine || joinLoading) return;
    setJoinLoading(true);
    setOptimisticState("none");
    try {
      await leaveBroadcast(broadcastId);
    } catch {
      setOptimisticState(null);
    } finally {
      setJoinLoading(false);
    }
  }, [currentUserId, isMine, joinLoading, broadcastId]);

  const joinButtonProps: JoinButtonProps = {
    state: joinState === "none" ? "default" : joinState,
    loading: joinLoading,
    onPress: joinState === "none" ? handleOmw : joinState === "on_my_way" ? handleJoin : handleLeave,
  };

  return { joinState, joinLoading, joinCount, omwCount, joinButtonProps };
}
