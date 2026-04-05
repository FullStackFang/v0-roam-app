import { supabase } from "./supabase";
import type {
  Profile,
  StatusBroadcast,
  StatusType,
  BroadcastDuration,
  FeedItem,
  FeedBucket,
} from "../types";

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

  // Delete any existing active broadcasts for this user
  await supabase
    .from("status_broadcasts")
    .delete()
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString());

  const expiresAt = computeExpiresAt("1h");

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

// ── Feed ──────────────────────────────────────────────────

const BUCKET_ORDER: FeedBucket[] = ["happening_now", "later_today", "tonight"];

function assignBucket(b: StatusBroadcast): FeedBucket {
  const msLeft = new Date(b.expires_at).getTime() - Date.now();
  const twoHours = 2 * 60 * 60 * 1000;

  // Anything expiring within 2 hours is happening now
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

  const items: FeedItem[] = broadcasts.map((b) => ({
    type: "broadcast" as const,
    data: b,
    bucket: assignBucket(b),
  }));

  // Sort: bucket priority, then join_count desc, then created_at desc
  items.sort((a, z) => {
    const bucketDiff = BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(z.bucket);
    if (bucketDiff !== 0) return bucketDiff;

    const joinDiff = (z.data.join_count ?? 0) - (a.data.join_count ?? 0);
    if (joinDiff !== 0) return joinDiff;

    return new Date(z.data.created_at).getTime() - new Date(a.data.created_at).getTime();
  });

  return items;
}
