/* ── Bonfire Design Tokens ─────────────────────────────────────────────── */

export const theme = {
  /* ── Palette ──────────────────────────────────────────────────────── */
  bg: "#FFF8F0",
  surface: "#FFFFFF",
  surfaceGlass: "rgba(255,248,240,0.90)",
  border: "rgba(0,0,0,0.08)",
  text: "#1A1B1E",
  muted: "rgba(26,27,30,0.48)",
  accent: "#FF5733",
  accentFill: "rgba(255,87,51,0.15)",
  accentTint: "rgba(255,87,51,0.10)",
  accentBorder: "rgba(255,87,51,0.35)",
  warm: "#F59E0B",
  cool: "#06B6D4",
  green: "#10B981",
  warmWhite: "#FFFCFA",
  error: "#EF4444",
  errorTint: "rgba(239,68,68,0.10)",
  greenTint: "rgba(16,185,129,0.10)",
  greenBorder: "rgba(16,185,129,0.30)",
  warmTint: "rgba(245,158,11,0.10)",
  warmBorder: "rgba(245,158,11,0.30)",
  surfaceElevated: "#FEFEFE",

  heat: {
    a: "#FF4D30",
    b: "#FF6B3D",
    c: "#FFAA33",
    d: "#F5B731",
    e: "#06B6D4",
    f: "#0EA5E9",
  },

  /* ── Avatar palette — deterministic per user ─────────────────────── */
  avatars: [
    "#FF6B6B", "#F59E0B", "#06B6D4", "#10B981",
    "#8B5CF6", "#EC4899", "#3B82F6", "#FF5733",
  ] as string[],

  /* ── Typography ───────────────────────────────────────────────────── */
  fonts: {
    heading: "Nunito_700Bold",
    headingHeavy: "Nunito_800ExtraBold",
    headingBlack: "Nunito_900Black",
    sans: "NunitoSans_400Regular",
    sansMedium: "NunitoSans_500Medium",
    sansSemiBold: "NunitoSans_600SemiBold",
    sansBold: "NunitoSans_700Bold",
  },

  /* ── Radii ────────────────────────────────────────────────────────── */
  radius: {
    xs: 6,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    full: 999,
  },

  /* ── Shadows (boxShadow CSS syntax — requires New Architecture) ──── */
  shadow: {
    card: "0px 2px 4px rgba(26,27,30,0.06), 0px 8px 20px rgba(26,27,30,0.06)",
    cardForming: "0px 2px 6px rgba(16,185,129,0.12), 0px 8px 24px rgba(26,27,30,0.06)",
    fab: "0px 4px 12px rgba(255,87,51,0.35), 0px 10px 28px rgba(255,87,51,0.18)",
    sheet: "0px -4px 12px rgba(26,27,30,0.06), 0px -16px 48px rgba(26,27,30,0.08)",
    pill: "0px 2px 6px rgba(26,27,30,0.08), 0px 4px 12px rgba(26,27,30,0.05)",
    toast: "0px 6px 20px rgba(26,27,30,0.14), 0px 2px 6px rgba(26,27,30,0.08)",
    tab: "0px -2px 6px rgba(26,27,30,0.04), 0px -6px 16px rgba(26,27,30,0.03)",
    joinBtn: "0px 2px 6px rgba(255,87,51,0.30), 0px 6px 16px rgba(255,87,51,0.15)",
    cardMoment: "0px 2px 6px rgba(245,158,11,0.12), 0px 8px 24px rgba(26,27,30,0.06)",
    header: "0px 2px 6px rgba(26,27,30,0.05)",
  },

  /* ── Z-index layers ──────────────────────────────────────────────── */
  z: {
    map: 1,
    header: 15,
    controls: 20,
    fab: 25,
    pill: 30,
    sheet: 35,
    toast: 50,
  },

  /* ── Spring configs (for Reanimated withSpring) ───────────────────── */
  spring: {
    snappy: { damping: 18, stiffness: 350 },   // micro-interactions, press
    gentle: { damping: 22, stiffness: 160 },    // entrance, fade
    bouncy: { damping: 10, stiffness: 180 },    // release, overshoot
    pop:    { damping: 8,  stiffness: 250 },    // dramatic pop-in for key moments
  },
} as const;

/** Pick a deterministic avatar color from a user ID */
export function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return theme.avatars[Math.abs(hash) % theme.avatars.length];
}

export type Theme = typeof theme;
