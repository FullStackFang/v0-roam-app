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

// ── Feed Types ────────────────────────────────────────────

export type FeedItem = { type: "broadcast"; data: StatusBroadcast };
