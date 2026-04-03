import { supabase } from "./supabase";
import type {
  Venue,
  Checkin,
  ActivityPointCollection,
  FilterCategory,
  VibeType,
} from "../types";

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
