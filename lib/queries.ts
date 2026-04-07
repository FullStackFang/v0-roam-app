import { supabase } from "./supabase";
import { distance, point } from "@turf/turf";
import type {
  Profile,
  StatusBroadcast,
  StatusType,
  BroadcastDuration,
  JoinType,
  AudienceType,
  FeedItem,
  FeedBucket,
  Moment,
  Circle,
  CircleMember,
  Gather,
  GatherRSVP,
} from "../types";
import { CLUSTERABLE_STATUS_TYPES } from "../types";

// ── Profile Queries ───────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, university_email, notifications_muted, created_at")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function upsertProfile(
  updates: Partial<Pick<Profile, "display_name" | "avatar_url" | "notifications_muted">>
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

export async function goLive(params: {
  lat: number;
  lng: number;
  statusType: StatusType;
  duration: BroadcastDuration;
  customText?: string;
  audienceType?: AudienceType;
  audienceCircleId?: string;
}): Promise<StatusBroadcast> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const expiresAt = computeExpiresAt(params.duration);

  // Insert new broadcast first to avoid an empty-state flash on the map
  const { data, error } = await supabase
    .from("status_broadcasts")
    .insert({
      user_id: user.id,
      status_type: params.statusType,
      custom_text: params.customText ?? null,
      duration: params.duration,
      expires_at: expiresAt.toISOString(),
      location: `SRID=4326;POINT(${params.lng} ${params.lat})`,
      lat: params.lat,
      lng: params.lng,
      audience_type: params.audienceType ?? "everyone",
      audience_circle_id: params.audienceCircleId ?? null,
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


// ── Join Queries ─────────────────────────────────────────

export async function fetchActiveBroadcastsWithJoins(): Promise<StatusBroadcast[]> {
  const { data, error } = await supabase
    .from("status_broadcasts")
    .select("*, profile:profiles(*), joins:broadcast_joins(id, user_id, join_type, created_at, profile:profiles(*))")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((b: StatusBroadcast) => ({
    ...b,
    join_count: b.joins?.length ?? 0,
  }));
}

export async function joinBroadcast(
  broadcastId: string,
  joinType: JoinType = "joined"
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("broadcast_joins")
    .upsert(
      { broadcast_id: broadcastId, user_id: user.id, join_type: joinType },
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

// ── Circle Queries ──────────────────────────────────────

export async function fetchMyCircles(): Promise<Circle[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get circle IDs the user belongs to
  const { data: memberships, error: memErr } = await supabase
    .from("circle_members")
    .select("circle_id")
    .eq("user_id", user.id);

  if (memErr || !memberships?.length) return [];

  const circleIds = memberships.map((m: { circle_id: string }) => m.circle_id);

  const { data, error } = await supabase
    .from("circles")
    .select("*, members:circle_members(count)")
    .in("id", circleIds)
    .order("last_active_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    ...c,
    member_count: c.members?.[0]?.count ?? 0,
  }));
}

export async function createCircle(name: string): Promise<Circle> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("circles")
    .insert({ name, created_by: user.id })
    .select()
    .single();

  if (error) throw error;

  // Auto-add creator as first member; delete circle if this fails
  const { error: memberErr } = await supabase
    .from("circle_members")
    .insert({ circle_id: data.id, user_id: user.id });

  if (memberErr) {
    await supabase.from("circles").delete().eq("id", data.id);
    throw memberErr;
  }

  return { ...data, member_count: 1 };
}

export async function fetchCircleMembers(circleId: string): Promise<CircleMember[]> {
  const { data, error } = await supabase
    .from("circle_members")
    .select("*, profile:profiles(id, display_name, avatar_url, university_email, created_at)")
    .eq("circle_id", circleId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addCircleMember(circleId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("circle_members")
    .upsert(
      { circle_id: circleId, user_id: userId },
      { onConflict: "circle_id,user_id" }
    );

  if (error) throw error;
}

export async function leaveCircle(circleId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("circle_members")
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function deleteCircle(circleId: string): Promise<void> {
  const { error } = await supabase
    .from("circles")
    .delete()
    .eq("id", circleId);

  if (error) throw error;
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  if (query.length < 2) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, university_email, notifications_muted, created_at")
    .ilike("display_name", `%${query}%`)
    .limit(10);

  if (error) return [];
  return data ?? [];
}

// ── Gather Queries ──────────────────────────────────────

export async function createGather(params: {
  title: string;
  statusType: StatusType;
  customText?: string;
  venueName?: string;
  lat?: number;
  lng?: number;
  startsAt?: string;
  durationHours: number;
  audienceType?: AudienceType;
  audienceCircleId?: string;
}): Promise<Gather> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const expiresAt = params.startsAt
    ? new Date(new Date(params.startsAt).getTime() + params.durationHours * 60 * 60 * 1000)
    : new Date(Date.now() + params.durationHours * 60 * 60 * 1000);

  const insert: Record<string, unknown> = {
    created_by: user.id,
    title: params.title,
    status_type: params.statusType,
    custom_text: params.customText ?? null,
    venue_name: params.venueName ?? null,
    lat: params.lat ?? null,
    lng: params.lng ?? null,
    starts_at: params.startsAt ?? null,
    expires_at: expiresAt.toISOString(),
    audience_type: params.audienceType ?? "everyone",
    audience_circle_id: params.audienceCircleId ?? null,
  };

  if (params.lat != null && params.lng != null) {
    insert.location = `SRID=4326;POINT(${params.lng} ${params.lat})`;
  }

  const { data, error } = await supabase
    .from("gathers")
    .insert(insert)
    .select("*, profile:profiles(*)")
    .single();

  if (error) throw error;

  // Auto-RSVP the creator as "in"
  await supabase
    .from("gather_invites")
    .insert({ gather_id: data.id, user_id: user.id, rsvp: "in" });

  return { ...data, in_count: 1 };
}

export async function fetchActiveGathers(): Promise<Gather[]> {
  const { data, error } = await supabase
    .from("gathers")
    .select("*, profile:profiles(*), invites:gather_invites(id, user_id, rsvp, created_at, profile:profiles(*))")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((g: Gather) => ({
    ...g,
    in_count: g.invites?.filter((i) => i.rsvp === "in").length ?? 0,
  }));
}

export async function rsvpGather(
  gatherId: string,
  rsvp: GatherRSVP
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("gather_invites")
    .upsert(
      { gather_id: gatherId, user_id: user.id, rsvp },
      { onConflict: "gather_id,user_id" }
    );

  if (error) throw error;
}

export async function cancelGather(gatherId: string): Promise<void> {
  const { error } = await supabase
    .from("gathers")
    .delete()
    .eq("id", gatherId);

  if (error) throw error;
}

export async function inviteToGather(
  gatherId: string,
  userIds: string[]
): Promise<void> {
  if (userIds.length === 0) return;

  const rows = userIds.map((uid) => ({
    gather_id: gatherId,
    user_id: uid,
    rsvp: "pending" as GatherRSVP,
  }));

  const { error } = await supabase
    .from("gather_invites")
    .upsert(rows, { onConflict: "gather_id,user_id" });

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
  const key = broadcasts.map((b) => `${b.id}:${b.join_count ?? 0}:${b.status_type}:${b.is_visible}:${b.expires_at}`).join("|");
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

function assignGatherBucket(g: Gather): FeedBucket {
  if (g.starts_at) {
    const startsMs = new Date(g.starts_at).getTime();
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    if (startsMs - now <= twoHours) return "happening_now";
    const hour = new Date(g.starts_at).getHours();
    return hour >= 18 ? "tonight" : "later_today";
  }
  // No start time = happening now
  return "happening_now";
}

export function deriveFeedItems(
  moments: Moment[],
  soloBroadcasts: StatusBroadcast[],
  gathers: Gather[] = []
): FeedItem[] {
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

  for (const g of gathers) {
    items.push({ type: "gather" as const, data: g, bucket: assignGatherBucket(g) });
  }

  items.sort((a, z) => {
    const bucketDiff = BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(z.bucket);
    if (bucketDiff !== 0) return bucketDiff;

    const aCount = a.type === "moment" ? a.data.participant_count
      : a.type === "gather" ? (a.data.in_count ?? 0)
      : ((a.data as StatusBroadcast).join_count ?? 0) + 1;
    const zCount = z.type === "moment" ? z.data.participant_count
      : z.type === "gather" ? (z.data.in_count ?? 0)
      : ((z.data as StatusBroadcast).join_count ?? 0) + 1;
    const countDiff = zCount - aCount;
    if (countDiff !== 0) return countDiff;

    const aTime = a.type === "moment" ? a.data.latest_activity
      : a.type === "gather" ? a.data.created_at
      : (a.data as StatusBroadcast).created_at;
    const zTime = z.type === "moment" ? z.data.latest_activity
      : z.type === "gather" ? z.data.created_at
      : (z.data as StatusBroadcast).created_at;
    return new Date(zTime).getTime() - new Date(aTime).getTime();
  });

  return items;
}

export async function fetchFeedData(): Promise<FeedItem[]> {
  const broadcasts = await fetchActiveBroadcastsWithJoins();
  const { moments, soloBroadcasts } = computeMomentsCached(broadcasts);
  return deriveFeedItems(moments, soloBroadcasts);
}
