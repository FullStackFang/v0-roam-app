import { supabase } from "./supabase";
import { distance, point } from "@turf/turf";
import type {
  Profile,
  StatusBroadcast,
  StatusType,
  BroadcastDuration,
  FeedItem,
  FeedBucket,
  Moment,
} from "../types";
import { CLUSTERABLE_STATUS_TYPES } from "../types";

// ── Profile Queries ───────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, university_email, created_at")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function upsertProfile(
  updates: Partial<Pick<Profile, "display_name" | "avatar_url">>
): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Broadcast Queries ─────────────────────────────────────

function computeExpiresAt(duration: BroadcastDuration): Date {
  const now = new Date();

  switch (duration) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000);

    case "today": {
      const sixPm = new Date(now);
      sixPm.setHours(18, 0, 0, 0);
      // If already past 6pm, give 30 minutes
      return sixPm.getTime() > now.getTime()
        ? sixPm
        : new Date(now.getTime() + 30 * 60 * 1000);
    }

    case "tonight":
    case "until_2am": {
      const twoAm = new Date(now);
      twoAm.setHours(2, 0, 0, 0);
      if (twoAm.getTime() <= now.getTime()) {
        twoAm.setDate(twoAm.getDate() + 1);
      }
      return twoAm;
    }

    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export async function fetchActiveBroadcasts(): Promise<StatusBroadcast[]> {
  const { data, error } = await supabase
    .from("status_broadcasts")
    .select("*, profile:profiles(*)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchMyActiveBroadcast(): Promise<StatusBroadcast | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("status_broadcasts")
    .select("*, profile:profiles(*)")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function goLive(
  location: { lat: number; lng: number }
): Promise<StatusBroadcast> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const expiresAt = computeExpiresAt("1h");

  // Insert new broadcast first to avoid an empty-state flash on the map
  const { data, error } = await supabase
    .from("status_broadcasts")
    .insert({
      user_id: user.id,
      status_type: "out_now",
      custom_text: null,
      duration: "1h",
      expires_at: expiresAt.toISOString(),
      location: `SRID=4326;POINT(${location.lng} ${location.lat})`,
      lat: location.lat,
      lng: location.lng,
    })
    .select("*, profile:profiles(*)")
    .single();

  if (error) throw error;

  // Clean up any previous active broadcasts (exclude the one just created)
  await supabase
    .from("status_broadcasts")
    .delete()
    .eq("user_id", user.id)
    .neq("id", data.id)
    .gt("expires_at", new Date().toISOString());

  return data;
}

export async function updateBroadcastContext(
  broadcastId: string,
  statusType: StatusType
): Promise<void> {
  const { error } = await supabase
    .from("status_broadcasts")
    .update({ status_type: statusType })
    .eq("id", broadcastId);

  if (error) throw error;
}

export async function updateBroadcastAvailability(
  broadcastId: string,
  duration: BroadcastDuration
): Promise<void> {
  const expiresAt = computeExpiresAt(duration);

  const { error } = await supabase
    .from("status_broadcasts")
    .update({ duration, expires_at: expiresAt.toISOString() })
    .eq("id", broadcastId);

  if (error) throw error;
}

export async function endBroadcast(broadcastId: string): Promise<void> {
  const { error } = await supabase
    .from("status_broadcasts")
    .delete()
    .eq("id", broadcastId);

  if (error) throw error;
}

export async function insertBroadcast(
  statusType: StatusType,
  duration: BroadcastDuration,
  customText?: string,
  location?: { lat: number; lng: number }
): Promise<StatusBroadcast> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const expiresAt = computeExpiresAt(duration);

  const row: Record<string, unknown> = {
    user_id: user.id,
    status_type: statusType,
    custom_text: customText ?? null,
    duration,
    expires_at: expiresAt.toISOString(),
  };

  if (location) {
    row.location = `SRID=4326;POINT(${location.lng} ${location.lat})`;
    row.lat = location.lat;
    row.lng = location.lng;
  }

  const { data, error } = await supabase
    .from("status_broadcasts")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchActiveBroadcastCount(): Promise<number> {
  const { count, error } = await supabase
    .from("status_broadcasts")
    .select("id", { count: "exact", head: true })
    .gt("expires_at", new Date().toISOString());

  if (error) throw error;
  return count ?? 0;
}

// ── Join Queries ─────────────────────────────────────────

export async function fetchActiveBroadcastsWithJoins(): Promise<StatusBroadcast[]> {
  const { data, error } = await supabase
    .from("status_broadcasts")
    .select("*, profile:profiles(*), joins:broadcast_joins(id, user_id, created_at, profile:profiles(*))")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((b: StatusBroadcast) => ({
    ...b,
    join_count: b.joins?.length ?? 0,
  }));
}

export async function joinBroadcast(broadcastId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("broadcast_joins")
    .upsert(
      { broadcast_id: broadcastId, user_id: user.id },
      { onConflict: "broadcast_id,user_id" }
    );

  if (error) throw error;
}

export async function leaveBroadcast(broadcastId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("broadcast_joins")
    .delete()
    .eq("broadcast_id", broadcastId)
    .eq("user_id", user.id);

  if (error) throw error;
}

// ── Invisible Mode ───────────────────────────────────────

export async function toggleBroadcastVisibility(
  broadcastId: string,
  isVisible: boolean
): Promise<void> {
  const { error } = await supabase
    .from("status_broadcasts")
    .update({ is_visible: isVisible })
    .eq("id", broadcastId);

  if (error) throw error;
}

// ── Dev Seed ─────────────────────────────────────────────

export async function seedAround(lat: number, lng: number): Promise<void> {
  const { error } = await supabase.rpc("seed_around", {
    center_lat: lat,
    center_lng: lng,
  });
  if (error) throw error;
}

export async function clearSeedData(): Promise<void> {
  const { error } = await supabase.rpc("clear_seed_data");
  if (error) throw error;
}

export async function seedCornellLaunch(): Promise<void> {
  const { error } = await supabase.rpc("seed_cornell_launch");
  if (error) throw error;
}

// ── Moment Computation ───────────────────────────────────

const MOMENT_RADIUS_KM = 0.5;

function clusterByProximity(broadcasts: StatusBroadcast[], radiusKm: number): StatusBroadcast[][] {
  const n = broadcasts.length;
  if (n < 2) return [broadcasts];

  const parent = Array.from({ length: n }, (_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = distance(
        point([broadcasts[i].lng!, broadcasts[i].lat!]),
        point([broadcasts[j].lng!, broadcasts[j].lat!]),
        { units: "kilometers" }
      );
      if (d <= radiusKm) union(i, j);
    }
  }

  const clusterMap = new Map<number, StatusBroadcast[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const arr = clusterMap.get(root) ?? [];
    arr.push(broadcasts[i]);
    clusterMap.set(root, arr);
  }

  return Array.from(clusterMap.values());
}

export function computeMoments(broadcasts: StatusBroadcast[]): {
  moments: Moment[];
  soloBroadcasts: StatusBroadcast[];
} {
  const clusterable = broadcasts.filter(
    (b) => b.lat != null && b.lng != null && CLUSTERABLE_STATUS_TYPES.includes(b.status_type)
  );
  const nonClusterable = broadcasts.filter(
    (b) => b.lat == null || b.lng == null || !CLUSTERABLE_STATUS_TYPES.includes(b.status_type)
  );

  const groups = new Map<StatusType, StatusBroadcast[]>();
  for (const b of clusterable) {
    const existing = groups.get(b.status_type) ?? [];
    existing.push(b);
    groups.set(b.status_type, existing);
  }

  const moments: Moment[] = [];
  const clusteredIds = new Set<string>();

  for (const [statusType, group] of groups) {
    const clusters = clusterByProximity(group, MOMENT_RADIUS_KM);

    for (const cluster of clusters) {
      if (cluster.length < 2) continue;

      const allProfiles: Profile[] = [];
      let participantCount = 0;
      let latestActivity = cluster[0].created_at;

      for (const b of cluster) {
        if (b.profile) allProfiles.push(b.profile);
        participantCount += 1;
        for (const j of (b.joins ?? [])) {
          participantCount += 1;
          if (j.profile && j.user_id !== b.user_id) allProfiles.push(j.profile);
          if (j.created_at > latestActivity) latestActivity = j.created_at;
        }
        if (b.created_at > latestActivity) latestActivity = b.created_at;
        clusteredIds.add(b.id);
      }

      const uniqueProfiles = Array.from(
        new Map(allProfiles.map((p) => [p.id, p])).values()
      );

      const sortedIds = cluster.map((b) => b.id).sort();

      moments.push({
        id: `moment-${sortedIds.join("-")}`,
        status_type: statusType,
        broadcasts: cluster,
        lat: cluster.reduce((s, b) => s + b.lat!, 0) / cluster.length,
        lng: cluster.reduce((s, b) => s + b.lng!, 0) / cluster.length,
        participant_count: participantCount,
        all_profiles: uniqueProfiles,
        earliest_expiry: cluster.reduce(
          (min, b) => (b.expires_at < min ? b.expires_at : min),
          cluster[0].expires_at
        ),
        latest_activity: latestActivity,
      });
    }
  }

  const soloBroadcasts = [
    ...nonClusterable,
    ...clusterable.filter((b) => !clusteredIds.has(b.id)),
  ];

  return { moments, soloBroadcasts };
}

let _momentsCache: { key: string; result: ReturnType<typeof computeMoments> } | null = null;

export function clearMomentsCache(): void {
  _momentsCache = null;
}

export function computeMomentsCached(broadcasts: StatusBroadcast[]) {
  const key = broadcasts.map((b) => `${b.id}:${b.join_count ?? 0}`).join("|");
  if (_momentsCache && _momentsCache.key === key) return _momentsCache.result;
  const result = computeMoments(broadcasts);
  _momentsCache = { key, result };
  return result;
}

// ── Feed ──────────────────────────────────────────────────

export const BUCKET_ORDER: FeedBucket[] = ["happening_now", "later_today", "tonight"];

function assignBucket(b: StatusBroadcast): FeedBucket {
  const msLeft = new Date(b.expires_at).getTime() - Date.now();
  const twoHours = 2 * 60 * 60 * 1000;

  if (msLeft <= twoHours) return "happening_now";

  switch (b.duration) {
    case "1h":
      return "happening_now";
    case "today":
      return "later_today";
    case "tonight":
    case "until_2am":
      return "tonight";
    case "24h": {
      const hour = new Date().getHours();
      return hour < 18 ? "later_today" : "tonight";
    }
  }
}

export async function fetchFeedData(): Promise<FeedItem[]> {
  const broadcasts = await fetchActiveBroadcastsWithJoins();
  const { moments, soloBroadcasts } = computeMomentsCached(broadcasts);

  const items: FeedItem[] = [];

  for (const b of soloBroadcasts) {
    items.push({ type: "broadcast" as const, data: b, bucket: assignBucket(b) });
  }

  for (const m of moments) {
    const representative = m.broadcasts.reduce((a, b) =>
      new Date(a.expires_at).getTime() < new Date(b.expires_at).getTime() ? a : b
    );
    items.push({ type: "moment" as const, data: m, bucket: assignBucket(representative) });
  }

  items.sort((a, z) => {
    const bucketDiff = BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(z.bucket);
    if (bucketDiff !== 0) return bucketDiff;

    const aCount = a.type === "moment" ? a.data.participant_count : ((a.data as StatusBroadcast).join_count ?? 0) + 1;
    const zCount = z.type === "moment" ? z.data.participant_count : ((z.data as StatusBroadcast).join_count ?? 0) + 1;
    const countDiff = zCount - aCount;
    if (countDiff !== 0) return countDiff;

    const aTime = a.type === "moment" ? a.data.latest_activity : (a.data as StatusBroadcast).created_at;
    const zTime = z.type === "moment" ? z.data.latest_activity : (z.data as StatusBroadcast).created_at;
    return new Date(zTime).getTime() - new Date(aTime).getTime();
  });

  return items;
}
