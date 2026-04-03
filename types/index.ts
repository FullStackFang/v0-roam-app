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
