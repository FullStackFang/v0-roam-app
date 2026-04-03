export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  university_email: string;
  created_at: string;
}

export type FilterCategory =
  | "all"
  | "eatdrink"
  | "happening"
  | "move"
  | "outside"
  | "focus";

export type TimeFilter = "tonight" | "weekend";

export type VibeType = "buzzing" | "quiet" | "skip";

export interface Venue {
  id: string;
  name: string;
  neighborhood: string;
  category: "eatdrink" | "happening" | "move" | "outside" | "focus";
  lat: number;
  lng: number;
  created_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  venue_id: string;
  vibe: VibeType;
  activity_score: number;
  created_at: string;
  expires_at: string;
  confirmed_count: number;
  venue?: Venue;
}

export interface VibeReport {
  id: string;
  checkin_id: string;
  user_id: string;
  confirmed: boolean;
  created_at: string;
}

export interface ActivityPoint {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    weight: number;
    venue_id: string;
  };
}

export interface ActivityPointCollection {
  type: "FeatureCollection";
  features: ActivityPoint[];
}

// ── Social Layer Types ──────────────────────────────────────

export type StatusType =
  | "out_now"
  | "up_for_drinks"
  | "up_for_dinner"
  | "grabbing_coffee"
  | "custom";

export type BroadcastDuration = "1h" | "until_2am" | "24h";

export interface StatusBroadcast {
  id: string;
  user_id: string;
  status_type: StatusType;
  custom_text: string | null;
  duration: BroadcastDuration;
  expires_at: string;
  location: unknown | null;
  created_at: string;
  profile?: Profile;
}

export interface Circle {
  id: string;
  name: string;
  created_by: string;
  streak_count: number;
  last_active_at: string | null;
  created_at: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export type PostureType = "definitely_in" | "down_if_others" | "sell_me";

export interface Activity {
  id: string;
  created_by: string;
  circle_id: string | null;
  title: string;
  venue_id: string | null;
  starts_at: string | null;
  created_at: string;
  venue?: Venue;
  creator?: Profile;
  interests?: ActivityInterest[];
}

export interface ActivityInterest {
  id: string;
  user_id: string;
  activity_id: string;
  posture: PostureType;
  confirmed_at: string | null;
  created_at: string;
  profile?: Profile;
}

// Discriminated union for feed cards
export type FeedItem =
  | { type: "broadcast"; data: StatusBroadcast }
  | { type: "activity"; data: Activity }
  | { type: "venue"; data: Venue & { friend_count: number; friends: Profile[] } };
