export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  university_email: string;
  notifications_muted: boolean;
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

// ── Intent States (Go Live first step) ───────────────────

export type IntentState = "available_now" | "out_today" | "out_tonight";

export const INTENT_OPTIONS: {
  intent: IntentState;
  duration: BroadcastDuration;
  emoji: string;
  label: string;
  description: string;
}[] = [
  { intent: "available_now", duration: "1h", emoji: "\ud83d\udfe2", label: "Available now", description: "Free for the next hour" },
  { intent: "out_today", duration: "today", emoji: "\u2600\ufe0f", label: "Out today", description: "Open to plans today" },
  { intent: "out_tonight", duration: "tonight", emoji: "\ud83c\udf19", label: "Out tonight", description: "Active for the night" },
];

export type JoinType = "joined" | "on_my_way";

export interface BroadcastJoin {
  id: string;
  broadcast_id: string;
  user_id: string;
  join_type: JoinType;
  created_at: string;
  profile?: Profile;
}

export type AudienceType = "everyone" | "circle";

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
  audience_type: AudienceType;
  audience_circle_id: string | null;
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
  | { type: "moment"; data: Moment; bucket: FeedBucket }
  | { type: "gather"; data: Gather; bucket: FeedBucket };

// ── Gather Types ─────────────────────────────────────────────

export type GatherRSVP = "pending" | "in" | "out";

export interface GatherInvite {
  id: string;
  gather_id: string;
  user_id: string;
  rsvp: GatherRSVP;
  created_at: string;
  profile?: Profile;
}

export interface Gather {
  id: string;
  created_by: string;
  title: string;
  status_type: StatusType;
  custom_text: string | null;
  venue_name: string | null;
  lat: number | null;
  lng: number | null;
  starts_at: string | null;
  expires_at: string;
  audience_type: AudienceType;
  audience_circle_id: string | null;
  created_at: string;
  profile?: Profile;
  invites?: GatherInvite[];
  in_count?: number;
}

// ── Circle Types ─────────────────────────────────────────────

export interface Circle {
  id: string;
  name: string;
  created_by: string;
  streak_count: number;
  last_active_at: string | null;
  created_at: string;
  member_count?: number;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

// ── Reward / Avatar Types ────────────────────────────────────

export type RewardType = "badge" | "accessory" | "border";

export interface UserReward {
  id: string;
  user_id: string;
  reward_key: string;
  reward_type: RewardType;
  unlocked_at: string;
}

export interface AvatarConfig {
  user_id: string;
  equipped_badge: string | null;
  equipped_accessory: string | null;
  equipped_border: string | null;
  updated_at: string;
}

export interface MilestoneDef {
  key: string;
  label: string;
  emoji: string;
  rewardType: RewardType;
  description: string;
}

export const MILESTONE_DEFS: MilestoneDef[] = [
  { key: "prometheus", label: "Prometheus", emoji: "\ud83d\udd25", rewardType: "badge", description: "First Go Live" },
  { key: "spark", label: "Spark", emoji: "\u26a1", rewardType: "badge", description: "10 venue ratings" },
  { key: "chefs_hat", label: "Chef's Hat", emoji: "\ud83d\udc68\u200d\ud83c\udf73", rewardType: "accessory", description: "50 venue ratings" },
  { key: "firekeeper", label: "Firekeeper", emoji: "\ud83d\udd25", rewardType: "badge", description: "Hosted 10 Gathers" },
  { key: "trailblazer", label: "Trailblazer", emoji: "\ud83e\udded", rewardType: "badge", description: "5 active circles" },
];
