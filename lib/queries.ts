import { supabase } from "./supabase";
import type {
  Profile,
  Venue,
  Checkin,
  ActivityPointCollection,
  FilterCategory,
  VibeType,
  StatusBroadcast,
  StatusType,
  BroadcastDuration,
  Circle,
  Activity,
  ActivityInterest,
  PostureType,
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

export async function fetchActiveCheckins(): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from("checkins")
    .select("*, venue:venues(*)")
    .gt("expires_at", new Date().toISOString());

  if (error) throw error;
  return data ?? [];
}

export async function fetchActivityPoints(): Promise<ActivityPointCollection> {
  const { data, error } = await supabase.rpc("get_active_activity_points");

  if (error) throw error;
  return data as ActivityPointCollection;
}

export async function insertCheckin(
  venueId: string,
  vibe: VibeType
): Promise<Checkin> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("checkins")
    .insert({
      user_id: user.id,
      venue_id: venueId,
      vibe,
      activity_score: vibe === "buzzing" ? 0.8 : vibe === "quiet" ? 0.3 : 0.1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function confirmVibe(
  checkinId: string,
  confirmed: boolean
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("confirm_vibe", {
    p_checkin_id: checkinId,
    p_user_id: user.id,
    p_confirmed: confirmed,
  });

  if (error) throw error;
}

export async function reportVibe(
  checkinId: string,
  newVibe: VibeType
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Insert a vibe report
  await supabase.from("vibe_reports").insert({
    checkin_id: checkinId,
    user_id: user.id,
    confirmed: false,
  });

  // Update the checkin's vibe
  await supabase
    .from("checkins")
    .update({ vibe: newVibe })
    .eq("id", checkinId);
}

export function getActivityLevel(score: number): 1 | 2 | 3 {
  if (score > 0.7) return 3;
  if (score > 0.4) return 2;
  return 1;
}

export function getHeatColor(level: 1 | 2 | 3, index: number): string {
  const colors: Record<number, string[]> = {
    3: ["#E84428", "#F05030"],
    2: ["#E88030", "#D4922A"],
    1: ["#4DAAAC", "#5A9EB0"],
  };
  return colors[level][index % 2];
}

export function filterVenuesByCategory(
  venues: Venue[],
  category: FilterCategory
): Venue[] {
  if (category === "all") return venues;
  return venues.filter((v) => v.category === category);
}

// ── Social Layer Queries ────────────────────────────────────

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

export async function fetchCircles(): Promise<Circle[]> {
  const { data, error } = await supabase
    .from("circles")
    .select("*")
    .order("last_active_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
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

  // Auto-add creator as member
  await supabase.from("circle_members").insert({
    circle_id: data.id,
    user_id: user.id,
  });

  return data;
}

export async function addCircleMember(
  circleId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("circle_members")
    .insert({ circle_id: circleId, user_id: userId });

  if (error) throw error;
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, university_email, created_at")
    .ilike("display_name", `${query}%`)
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*, venue:venues(*), creator:profiles!created_by(*), interests:activity_interest(*, profile:profiles(*))")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createActivity(
  title: string,
  circleId?: string,
  venueId?: string,
  startsAt?: string
): Promise<Activity> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("activities")
    .insert({
      created_by: user.id,
      circle_id: circleId ?? null,
      title,
      venue_id: venueId ?? null,
      starts_at: startsAt ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function expressInterest(
  activityId: string,
  posture: PostureType
): Promise<ActivityInterest> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("activity_interest")
    .insert({
      user_id: user.id,
      activity_id: activityId,
      posture,
      confirmed_at: posture === "definitely_in" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInterest(
  interestId: string,
  updates: Partial<Pick<ActivityInterest, "posture" | "confirmed_at">>
): Promise<void> {
  const { error } = await supabase
    .from("activity_interest")
    .update(updates)
    .eq("id", interestId);

  if (error) throw error;
}

export async function fetchFeedData(): Promise<FeedItem[]> {
  const [broadcasts, activities] = await Promise.all([
    fetchActiveBroadcasts(),
    fetchActivities(),
  ]);

  const items: FeedItem[] = [
    ...broadcasts.map((b) => ({ type: "broadcast" as const, data: b })),
    ...activities.map((a) => ({ type: "activity" as const, data: a })),
  ];

  // Sort by created_at descending
  items.sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() -
      new Date(a.data.created_at).getTime()
  );

  return items;
}
