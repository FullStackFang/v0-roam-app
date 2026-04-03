# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Roam

Roam is a real-time social map app for Cornell University students. Users see nearby venues on an interactive map, check in with "vibes" (buzzing/quiet/skip), and view crowdsourced activity levels via heatmaps. Check-ins expire after 2 hours.

## Development Commands

```bash
npx expo start          # Start dev server (or: npm start)
npx expo start --android  # Launch on Android
npx expo start --ios      # Launch on iOS
npx expo start --web      # Launch in browser

eas build --profile development --platform android  # Dev build (APK)
eas build --profile preview --platform android      # Preview build
eas build --profile production --platform android   # Production build
```

Note: `.npmrc` sets `legacy-peer-deps=true` — use `npm install` (not pnpm).

## Architecture

**Expo Router** file-based routing in `app/`:
- `_layout.tsx` — Root layout with Supabase auth guard (redirects to `/auth` if no session)
- `index.tsx` — Main map screen, orchestrates all state (venues, checkins, filters, selected venue)
- `auth.tsx` — Login/signup restricted to `@cornell.edu` emails

**Data layer** in `lib/`:
- `supabase.ts` — Client init with AsyncStorage persistence and auto-refresh
- `queries.ts` — All Supabase queries and business logic helpers (`fetchVenues`, `fetchActiveCheckins`, `fetchActivityPoints`, `insertCheckin`, `confirmVibe`, `reportVibe`, `getActivityLevel`, `getHeatColor`, `filterVenuesByCategory`)

**Components** in `components/map/`:
- `RoamMap.tsx` — MapLibre GL map (OpenFreeMap tiles), animated venue markers with pulsing rings, heatmap layer, real-time Supabase subscription on `checkins` table
- `SpotCard.tsx` — Bottom sheet for venue details and vibe reporting, spring-animated slide up/down
- `TopBar.tsx` — Header with logo and location pill
- `FilterBar.tsx` — Horizontal scrollable category filter pills
- `TimeToggle.tsx` — Tonight/Weekend toggle

**Shared:**
- `constants/theme.ts` — Centralized design tokens (colors, fonts)
- `types/index.ts` — All TypeScript types

## Supabase Schema

Three tables in `supabase/schema.sql` with PostGIS enabled:

- **`venues`** — Locations with PostGIS geography column, categories: `eatdrink | happening | move | outside | focus`
- **`checkins`** — User check-ins with `vibe` (buzzing/quiet/skip), `activity_score` (0–1), auto-expires in 2 hours
- **`vibe_reports`** — Confirmations/rejections of existing vibes

Key RPC functions: `get_active_activity_points()` (GeoJSON for heatmap), `compute_activity_score()`, `confirm_vibe()`.

Row-level security is enabled on all tables. Realtime is enabled on `checkins`.

Seed data in `supabase/seed.ts` — 8 demo venues with mock checkins.

## Styling

NativeWind (Tailwind for React Native) with custom theme in `tailwind.config.js`:
- Accent: `#FF5C3A`, Warm: `#F09040`, Cool: `#4DAAAC`, Green: `#3BAA82`
- Fonts: Playfair Display (serif headings), DM Sans (sans body)
- Heat gradient colors: 6 stops (`heat-a` through `heat-f`)
- All colors also exported in `constants/theme.ts` for use outside Tailwind

## Key Patterns

- **Real-time**: `RoamMap` subscribes to Supabase realtime channel on `checkins` table and re-fetches on INSERT/UPDATE/DELETE
- **Animations**: Uses React Native `Animated` API (not Reanimated) for marker pulse rings and SpotCard slide; native driver where possible
- **Map center**: Cornell campus at `42.4534, -76.4735`, zoom 14
- **Map tiles**: OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`)
- **Path alias**: `@/*` maps to project root in tsconfig
- **New Architecture**: Enabled in app.json

## Environment Variables

Required in `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=<supabase project url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
EXPO_PUBLIC_GOOGLE_PLACES_KEY=<google places api key>
```
