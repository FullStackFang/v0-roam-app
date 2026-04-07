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
  fetchActiveGathers,
  fetchMyCircles,
  fetchCircleMembers,
  computeMoments,
  deriveFeedItems,
} from "./queries";
import { debounce } from "./debounce";
import type { StatusBroadcast, Moment, FeedItem, Circle, Gather } from "../types";

interface BroadcastsContextValue {
  broadcasts: StatusBroadcast[];
  moments: Moment[];
  soloBroadcasts: StatusBroadcast[];
  gathers: Gather[];
  feedItems: FeedItem[];
  currentUserId: string | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  circles: Circle[];
  refreshCircles: () => Promise<void>;
  activeCircleFilter: Circle | null;
  setActiveCircleFilter: (circle: Circle | null) => void;
}

const BroadcastsContext = createContext<BroadcastsContextValue | null>(null);

export function useBroadcasts(): BroadcastsContextValue {
  const ctx = useContext(BroadcastsContext);
  if (!ctx) throw new Error("useBroadcasts must be used within BroadcastsProvider");
  return ctx;
}

export function BroadcastsProvider({ children }: { children: React.ReactNode }) {
  const [allBroadcasts, setAllBroadcasts] = useState<StatusBroadcast[]>([]);
  const [allGathers, setAllGathers] = useState<Gather[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);

  const refreshCircles = useCallback(async () => {
    try {
      const data = await fetchMyCircles();
      setCircles(data);
    } catch {}
  }, []);

  // Circle filter
  const [activeCircleFilter, setActiveCircleFilter] = useState<Circle | null>(null);
  const [filterMemberIds, setFilterMemberIds] = useState<Set<string> | null>(null);
  const [filterReady, setFilterReady] = useState(true);

  // Fetch circle members when filter changes
  useEffect(() => {
    if (!activeCircleFilter) {
      setFilterMemberIds(null);
      setFilterReady(true);
      return;
    }
    setFilterReady(false);
    fetchCircleMembers(activeCircleFilter.id)
      .then((members) => setFilterMemberIds(new Set(members.map((m) => m.user_id))))
      .catch(() => setFilterMemberIds(null))
      .finally(() => setFilterReady(true));
  }, [activeCircleFilter]);

  // Apply circle filter — show empty while loading to avoid unfiltered flash
  const broadcasts = useMemo(() => {
    if (!activeCircleFilter) return allBroadcasts;
    if (!filterReady || !filterMemberIds) return [];
    return allBroadcasts.filter((b) => filterMemberIds.has(b.user_id));
  }, [allBroadcasts, activeCircleFilter, filterMemberIds, filterReady]);

  const gathers = useMemo(() => {
    if (!activeCircleFilter) return allGathers;
    if (!filterReady || !filterMemberIds) return [];
    return allGathers.filter((g) => filterMemberIds.has(g.created_by));
  }, [allGathers, activeCircleFilter, filterMemberIds, filterReady]);

  const { moments, soloBroadcasts, feedItems } = useMemo(() => {
    const { moments: m, soloBroadcasts: solo } = computeMoments(broadcasts);
    return { moments: m, soloBroadcasts: solo, feedItems: deriveFeedItems(m, solo, gathers) };
  }, [broadcasts, gathers]);

  const loadData = useCallback(async () => {
    try {
      setError(false);
      const [raw, rawGathers] = await Promise.all([
        fetchActiveBroadcastsWithJoins(),
        fetchActiveGathers(),
      ]);
      setAllBroadcasts(raw);
      setAllGathers(rawGathers);
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
    refreshCircles();

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gathers" },
        () => debouncedLoad()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gather_invites" },
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
      gathers,
      feedItems,
      currentUserId,
      loading,
      error,
      refresh,
      circles,
      refreshCircles,
      activeCircleFilter,
      setActiveCircleFilter,
    }),
    [broadcasts, moments, soloBroadcasts, gathers, feedItems, currentUserId, loading, error, refresh, circles, refreshCircles, activeCircleFilter]
  );

  return (
    <BroadcastsContext.Provider value={value}>
      {children}
    </BroadcastsContext.Provider>
  );
}
