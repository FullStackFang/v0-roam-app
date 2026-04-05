/* ── Bonfire Design Tokens ─────────────────────────────────────────────── */

export const theme = {
  /* ── Palette ──────────────────────────────────────────────────────── */
  bg: "#F5F3EF",
  surface: "#FFFFFF",
  surfaceGlass: "rgba(255,255,255,0.82)",
  border: "rgba(0,0,0,0.06)",
  text: "#1A1B1E",
  muted: "rgba(26,27,30,0.40)",
  accent: "#F04D2C",
  accentFill: "rgba(240,77,44,0.12)",
  accentTint: "rgba(240,77,44,0.08)",
  accentBorder: "rgba(240,77,44,0.30)",
  warm: "#E08A3C",
  cool: "#4A9E9E",
  green: "#38A07A",
  warmWhite: "#FFFCFA",
  error: "#D93025",
  errorTint: "rgba(217,48,37,0.08)",
  greenTint: "rgba(56,160,122,0.08)",
  greenBorder: "rgba(56,160,122,0.25)",
  warmTint: "rgba(224,138,60,0.08)",
  warmBorder: "rgba(224,138,60,0.25)",
  surfaceElevated: "#FEFEFE",

  heat: {
    a: "#E84428",
    b: "#F05030",
    c: "#E88030",
    d: "#D4922A",
    e: "#4DAAAC",
    f: "#5A9EB0",
  },

  /* ── Avatar palette — deterministic per user ─────────────────────── */
  avatars: [
    "#E06850", "#D4922A", "#4A9E9E", "#38A07A",
    "#7C6BB4", "#C75B8E", "#5A8FBD", "#E08A3C",
  ] as string[],

  /* ── Typography ───────────────────────────────────────────────────── */
  fonts: {
    serif: "PlayfairDisplay_500Medium",
    serifItalic: "PlayfairDisplay_500Medium_Italic",
    serifBold: "PlayfairDisplay_700Bold",
    sans: "DMSans_400Regular",
    sansMedium: "DMSans_500Medium",
    sansSemiBold: "DMSans_600SemiBold",
    sansBold: "DMSans_700Bold",
  },

  /* ── Radii ────────────────────────────────────────────────────────── */
  radius: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 999,
  },

  /* ── Shadows (boxShadow CSS syntax — requires New Architecture) ──── */
  shadow: {
    card: "0px 1px 3px rgba(26,27,30,0.04), 0px 4px 12px rgba(26,27,30,0.03)",
    cardForming: "0px 1px 4px rgba(56,160,122,0.06), 0px 6px 16px rgba(26,27,30,0.04)",
    fab: "0px 2px 8px rgba(240,77,44,0.25), 0px 8px 24px rgba(240,77,44,0.15)",
    sheet: "0px -2px 8px rgba(26,27,30,0.04), 0px -12px 40px rgba(26,27,30,0.06)",
    pill: "0px 1px 4px rgba(26,27,30,0.05), 0px 2px 8px rgba(26,27,30,0.03)",
    toast: "0px 4px 16px rgba(26,27,30,0.10), 0px 1px 4px rgba(26,27,30,0.06)",
    tab: "0px -1px 3px rgba(26,27,30,0.03), 0px -4px 12px rgba(26,27,30,0.02)",
    joinBtn: "0px 1px 4px rgba(240,77,44,0.25), 0px 3px 10px rgba(240,77,44,0.12)",
    cardMoment: "0px 1px 4px rgba(224,138,60,0.06), 0px 6px 16px rgba(26,27,30,0.04)",
    header: "0px 1px 3px rgba(26,27,30,0.03)",
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
    snappy: { damping: 20, stiffness: 300 },   // micro-interactions, press
    gentle: { damping: 25, stiffness: 150 },    // entrance, fade
    bouncy: { damping: 15, stiffness: 200 },    // release, overshoot
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
