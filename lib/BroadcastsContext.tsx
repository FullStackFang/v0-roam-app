import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { supabase } from "./supabase";
import {
  fetchActiveBroadcastsWithJoins,
  computeMomentsCached,
  deriveFeedItems,
} from "./queries";
import { debounce } from "./debounce";
import type { StatusBroadcast, Moment, FeedItem } from "../types";

interface BroadcastsContextValue {
  broadcasts: StatusBroadcast[];
  moments: Moment[];
  soloBroadcasts: StatusBroadcast[];
  feedItems: FeedItem[];
  currentUserId: string | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
}

const BroadcastsContext = createContext<BroadcastsContextValue | null>(null);

export function useBroadcasts(): BroadcastsContextValue {
  const ctx = useContext(BroadcastsContext);
  if (!ctx) throw new Error("useBroadcasts must be used within BroadcastsProvider");
  return ctx;
}

export function BroadcastsProvider({ children }: { children: React.ReactNode }) {
  const [broadcasts, setBroadcasts] = useState<StatusBroadcast[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [soloBroadcasts, setSoloBroadcasts] = useState<StatusBroadcast[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(false);
      const raw = await fetchActiveBroadcastsWithJoins();
      const { moments: m, soloBroadcasts: solo } = computeMomentsCached(raw);
      const feed = deriveFeedItems(m, solo);
      setBroadcasts(raw);
      setMoments(m);
      setSoloBroadcasts(solo);
      setFeedItems(feed);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedLoad = useMemo(() => debounce(loadData, 500), [loadData]);

  const refresh = useCallback(async () => {
    debouncedLoad.cancel();
    await loadData();
  }, [debouncedLoad, loadData]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });

    loadData();

    const channel = supabase
      .channel("broadcasts-shared")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "status_broadcasts" },
        () => debouncedLoad()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "broadcast_joins" },
        () => debouncedLoad()
      )
      .subscribe();

    return () => {
      debouncedLoad.cancel();
      supabase.removeChannel(channel);
    };
  }, [loadData, debouncedLoad]);

  const value = useMemo(
    () => ({
      broadcasts,
      moments,
      soloBroadcasts,
      feedItems,
      currentUserId,
      loading,
      error,
      refresh,
    }),
    [broadcasts, moments, soloBroadcasts, feedItems, currentUserId, loading, error, refresh]
  );

  return (
    <BroadcastsContext.Provider value={value}>
      {children}
    </BroadcastsContext.Provider>
  );
}
