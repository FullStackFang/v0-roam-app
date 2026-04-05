export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  university_email: string;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  neighborhood: string;
  category: "eatdrink" | "happening" | "move" | "outside" | "focus";
  lat: number;
  lng: number;
  created_at: string;
}

// ── Broadcast Types ───────────────────────────────────────

export type StatusType =
  | "out_now"
  | "up_for_drinks"
  | "up_for_dinner"
  | "grabbing_coffee"
  | "walk"
  | "open"
  | "custom";

export type BroadcastDuration = "1h" | "until_2am" | "24h" | "today" | "tonight";

export interface BroadcastJoin {
  id: string;
  broadcast_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export interface StatusBroadcast {
  id: string;
  user_id: string;
  status_type: StatusType;
  custom_text: string | null;
  duration: BroadcastDuration;
  expires_at: string;
  location: unknown | null;
  lat: number | null;
  lng: number | null;
  fuzzy_lat: number | null;
  fuzzy_lng: number | null;
  is_visible: boolean;
  created_at: string;
  profile?: Profile;
  joins?: BroadcastJoin[];
  join_count?: number;
}

export const STATUS_LABELS: Record<StatusType, string> = {
  out_now: "Out now",
  up_for_drinks: "Drinks",
  up_for_dinner: "Dinner",
  grabbing_coffee: "Coffee",
  walk: "Walk",
  open: "Open",
  custom: "",
};

export const CONTEXT_OPTIONS: { type: StatusType; emoji: string; label: string }[] = [
  { type: "up_for_drinks", emoji: "\ud83c\udf77", label: "Drinks" },
  { type: "grabbing_coffee", emoji: "\u2615", label: "Coffee" },
  { type: "walk", emoji: "\ud83d\udeb6", label: "Walk" },
  { type: "open", emoji: "\u2728", label: "Open" },
];

export interface QuickAction {
  type: StatusType;
  label: string;
  description: string;
  iconName: string;
}

export const QUICK_ACTION_OPTIONS: QuickAction[] = [
  { type: "up_for_dinner", label: "Grab Food", description: "Find someone to eat with", iconName: "Utensils" },
  { type: "up_for_drinks", label: "Get Drinks", description: "Head out for drinks", iconName: "Wine" },
  { type: "walk", label: "Go Somewhere", description: "Walk, explore, get outside", iconName: "Footprints" },
  { type: "open", label: "Do Something", description: "Open to whatever's happening", iconName: "Sparkles" },
  { type: "grabbing_coffee", label: "Grab Coffee", description: "Quick coffee run", iconName: "Coffee" },
];

export const AVAILABILITY_OPTIONS: { duration: BroadcastDuration; emoji: string; label: string }[] = [
  { duration: "1h", emoji: "\ud83d\udfe2", label: "Available now" },
  { duration: "today", emoji: "\u2600\ufe0f", label: "Out today" },
  { duration: "tonight", emoji: "\ud83c\udf19", label: "Out tonight" },
];

// ── Moment Types ─────────────────────────────────────────

export const CLUSTERABLE_STATUS_TYPES: StatusType[] = [
  "up_for_drinks", "up_for_dinner", "grabbing_coffee", "walk", "open",
];

export interface Moment {
  id: string;
  status_type: StatusType;
  broadcasts: StatusBroadcast[];
  lat: number;
  lng: number;
  participant_count: number;
  all_profiles: Profile[];
  earliest_expiry: string;
  latest_activity: string;
}

// ── Feed Types ────────────────────────────────────────────

export type FeedBucket = "happening_now" | "later_today" | "tonight";

export const BUCKET_LABELS: Record<FeedBucket, string> = {
  happening_now: "Happening Now",
  later_today: "Later Today",
  tonight: "Tonight",
};

export type FeedItem =
  | { type: "broadcast"; data: StatusBroadcast; bucket: FeedBucket }
  | { type: "moment"; data: Moment; bucket: FeedBucket };
