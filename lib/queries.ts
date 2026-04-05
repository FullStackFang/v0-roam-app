import { supabase } from "./supabase";
import type {
  Profile,
  Venue,
  StatusBroadcast,
  StatusType,
  BroadcastDuration,
  FeedItem,
} from "../types";

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

export async function fetchVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, neighborhood, category, lat, lng, created_at");

  if (error) throw error;
  return data ?? [];
}

// ── Broadcast Queries ────��────────────────────────────────

export async function fetchActiveBroadcasts(): Promise<StatusBroadcast[]> {
  const { data, error } = await supabase
    .from("status_broadcasts")
    .select("*, profile:profiles(*)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
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

  // Compute expires_at
  const now = new Date();
  let expiresAt: Date;
  if (duration === "1h") {
    expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  } else if (duration === "until_2am") {
    expiresAt = new Date(now);
    expiresAt.setHours(26, 0, 0, 0); // next 2am
    if (expiresAt.getTime() <= now.getTime()) {
      expiresAt.setDate(expiresAt.getDate() + 1);
    }
  } else {
    expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    status_type: statusType,
    custom_text: customText ?? null,
    duration,
    expires_at: expiresAt.toISOString(),
  };

  if (location) {
    row.location = `SRID=4326;POINT(${location.lng} ${location.lat})`;
  }

  const { data, error } = await supabase
    .from("status_broadcasts")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Feed ──────────────────────────────────────────────────

export async function fetchFeedData(): Promise<FeedItem[]> {
  const broadcasts = await fetchActiveBroadcasts();
  return broadcasts.map((b) => ({ type: "broadcast" as const, data: b }));
}
