# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Bonfire

Bonfire is a real-time social availability app for Cornell University students. Users broadcast that they're "out" with one tap, appear on a live map, and others can see who's available and join what's forming. Everything is ephemeral — broadcasts auto-expire.

**Core principle:** Availability > Events. Speed over complexity. 1 tap to go live, 1–2 taps to join.

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

**Expo Go does NOT work** — MapLibre GL Native requires native code bundling. Always use a dev client build (`eas build --profile development`) to test on-device.

## Architecture

**Expo Router** file-based routing in `app/`:
- `_layout.tsx` — Root layout with Supabase auth guard (redirects to `/auth` if no session)
- `(tabs)/map.tsx` — Main map screen with broadcast FAB
- `(tabs)/feed.tsx` — Feed of active broadcasts
- `auth.tsx` — Login/signup restricted to `@cornell.edu` emails

**Data layer** in `lib/`:
- `supabase.ts` — Client init with AsyncStorage persistence and auto-refresh
- `queries.ts` — Supabase queries: `fetchProfile`, `upsertProfile`, `fetchActiveBroadcasts`, `insertBroadcast`, `fetchActiveBroadcastCount`, `fetchFeedData`

**Components** in `components/`:
- `map/BonfireMap.tsx` — MapLibre GL map (OpenFreeMap positron tiles), real-time Supabase subscription on `status_broadcasts` table
- `map/TopBar.tsx` — Header with logo and city selector pill
- `broadcast/StatusFAB.tsx` — Floating action button to open broadcast sheet
- `broadcast/BroadcastSheet.tsx` — Bottom sheet for broadcasting availability (preset statuses + custom text + duration)
- `feed/FeedList.tsx` — Pull-to-refresh FlatList of feed items
- `feed/FeedCard.tsx` — Routes feed items to card components
- `feed/BroadcastCard.tsx` — Card displaying an active broadcast
- `feed/AvatarStack.tsx` — Reusable avatar stack component
- `ui/Toast.tsx` — Floating toast notification

**Shared:**
- `constants/theme.ts` — Centralized design tokens (colors, fonts, radii, spring configs)
- `constants/cities.ts` — City definitions (Ithaca, NYC) with map centers
- `types/index.ts` — All TypeScript types

## Supabase Schema

Core tables in `supabase/schema.sql` with PostGIS enabled:

- **`profiles`** — User profiles auto-created on signup via trigger
- **`venues`** — Locations with PostGIS geography column (kept for future venue context)
- **`status_broadcasts`** — User availability broadcasts with status_type, duration, optional location, auto-expiry

Row-level security is enabled on all tables. Realtime is enabled on `status_broadcasts`.

## Styling

NativeWind (Tailwind for React Native) with custom theme in `tailwind.config.js`:
- Accent: `#F04D2C`, Warm: `#E08A3C`, Cool: `#4A9E9E`, Green: `#38A07A`
- Fonts: Playfair Display (serif headings), DM Sans (sans body)
- All colors also exported in `constants/theme.ts` for use outside Tailwind

## Key Patterns

- **Real-time**: `BonfireMap` subscribes to Supabase realtime on `status_broadcasts` table
- **Animations**: Uses React Native `Animated` API (not Reanimated); native driver where possible
- **Map center**: Cornell campus at `42.4534, -76.4735`, zoom 14
- **Map tiles**: OpenFreeMap (`https://tiles.openfreemap.org/styles/positron`)
- **Path alias**: `@/*` maps to project root in tsconfig
- **New Architecture**: Enabled in app.json

## Environment Variables

Required in `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=<supabase project url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
```
