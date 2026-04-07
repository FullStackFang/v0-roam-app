import { useState, useCallback, useEffect } from "react";
import { rsvpGather } from "../lib/queries";
import type { GatherInvite, GatherRSVP } from "../types";

type RSVPState = "none" | "in" | "out";

export interface RSVPButtonProps {
  state: RSVPState;
  loading: boolean;
  onIn: () => void;
  onOut: () => void;
}

interface UseGatherRSVPResult {
  rsvpState: RSVPState;
  inCount: number;
  rsvpButtonProps: RSVPButtonProps;
}

export function useGatherRSVP(
  gatherId: string,
  currentUserId: string | null,
  isMine: boolean,
  invites: GatherInvite[],
  baseInCount: number
): UseGatherRSVPResult {
  const [loading, setLoading] = useState(false);
  const [optimistic, setOptimistic] = useState<RSVPState | null>(null);

  const myInvite = invites.find((i) => i.user_id === currentUserId);
  const serverState: RSVPState = myInvite
    ? (myInvite.rsvp === "in" ? "in" : myInvite.rsvp === "out" ? "out" : "none")
    : "none";

  const rsvpState = optimistic ?? serverState;

  let inCount = baseInCount;
  if (optimistic !== null && optimistic !== serverState) {
    if (serverState !== "in" && optimistic === "in") inCount += 1;
    if (serverState === "in" && optimistic !== "in") inCount -= 1;
  }

  // Reset optimistic on server change
  const invitesKey = invites.map((i) => `${i.user_id}:${i.rsvp}`).join(",");
  useEffect(() => {
    setOptimistic(null);
  }, [invitesKey]);

  const handleIn = useCallback(async () => {
    if (!currentUserId || loading) return;
    const next: RSVPState = rsvpState === "in" ? "none" : "in";
    setLoading(true);
    setOptimistic(next);
    try {
      await rsvpGather(gatherId, next === "none" ? "pending" : "in");
    } catch {
      setOptimistic(null);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loading, rsvpState, gatherId]);

  const handleOut = useCallback(async () => {
    if (!currentUserId || loading) return;
    setLoading(true);
    setOptimistic("out");
    try {
      await rsvpGather(gatherId, "out");
    } catch {
      setOptimistic(null);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loading, gatherId]);

  return {
    rsvpState,
    inCount,
    rsvpButtonProps: {
      state: rsvpState,
      loading,
      onIn: handleIn,
      onOut: handleOut,
    },
  };
}
