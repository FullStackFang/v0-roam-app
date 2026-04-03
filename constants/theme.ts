/* ── Roam Design Tokens ─────────────────────────────────────────────── */

export const theme = {
  /* ── Palette ──────────────────────────────────────────────────────── */
  bg: "#F5F3EF", // warm paper — replaces cold blue-grey
  surface: "#FFFFFF",
  surfaceGlass: "rgba(255,255,255,0.82)", // frosted overlays
  border: "rgba(0,0,0,0.06)",
  text: "#1A1B1E",
  muted: "rgba(26,27,30,0.40)",
  accent: "#F04D2C", // warm red-orange, slightly desaturated from #FF5C3A
  warm: "#E08A3C",
  cool: "#4A9E9E",
  green: "#38A07A",

  heat: {
    a: "#E84428",
    b: "#F05030",
    c: "#E88030",
    d: "#D4922A",
    e: "#4DAAAC",
    f: "#5A9EB0",
  },

  /* ── Typography ───────────────────────────────────────────────────── */
  fonts: {
    // Serif — brand mark + venue headings
    serif: "PlayfairDisplay_500Medium",
    serifItalic: "PlayfairDisplay_500Medium_Italic",
    serifBold: "PlayfairDisplay_700Bold",
    // Sans — UI + body
    sans: "DMSans_400Regular",
    sansMedium: "DMSans_500Medium",
    sansSemiBold: "DMSans_600SemiBold",
    sansBold: "DMSans_700Bold",
  },

  /* ── Radii ────────────────────────────────────────────────────────── */
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
  },

  /* ── Spring configs (for Animated.spring) ─────────────────────────── */
  spring: {
    snappy: { damping: 20, stiffness: 300, useNativeDriver: true },
    gentle: { damping: 25, stiffness: 150, useNativeDriver: true },
    bouncy: { damping: 15, stiffness: 200, useNativeDriver: true },
  },
} as const;

export type Theme = typeof theme;
