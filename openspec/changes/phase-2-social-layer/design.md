## Context

Roam has a working map with venue markers, heatmap, vibe reporting, and Cornell auth. The app is a single-screen map with overlay controls. Phase 2 adds the social layer: broadcasting availability, a feed, commitment mechanics, and circles. This is the biggest architectural change so far — it introduces tab navigation, a second primary screen (Feed), and 5 new database tables.

Current stack: Expo 54, Expo Router, MapLibre, Supabase (Postgres + Realtime + Auth), NativeWind, React Native Animated API.

## Goals / Non-Goals

**Goals:**
- Users can broadcast availability with one tap and see friends' broadcasts on the map
- A Feed tab shows what's happening in circles — broadcasts, activities, venue signals
- Users can express commitment postures on activities (definitely_in / down_if_others / sell_me)
- Circles scope the social graph — only see content from your circles
- All social data flows through Supabase with RLS and realtime

**Non-Goals:**
- No chat / messaging (deferred — circles are scoped feeds only)
- No push notifications (Phase 4)
- No AI suggestions or smart ranking (Phase 4)
- No profile editing UI (Phase 3)
- No deep linking or sharing (Phase 3)

## Decisions

### 1. Tab navigation with Expo Router (tabs) group

Convert from the current single-route `app/index.tsx` to an `app/(tabs)/` group with `_layout.tsx` containing a bottom tab bar. Two tabs: Map and Feed.

The map screen moves to `app/(tabs)/map.tsx`. Feed goes to `app/(tabs)/feed.tsx`. The root `_layout.tsx` keeps the auth guard and renders the `(tabs)` group.

**Alternative considered:** Drawer navigation or floating tab indicator. Rejected — bottom tabs are the standard pattern for two primary surfaces and work best for thumb-reachable navigation.

### 2. Minimal tab bar — two icons, no labels

The tab bar should be extremely subtle — just two icons (map pin + list icon) at the bottom with accent color when active, muted when inactive. No text labels, no chunky bar. This keeps the map feeling full-screen.

### 3. Feed card architecture — discriminated union type

Feed cards render from a single `FeedCard` component that switches on a `type` discriminant: `broadcast | activity | venue`. Each variant has its own sub-component. The feed data is fetched as separate queries and merged/sorted client-side.

**Alternative considered:** Separate FlatList sections per type. Rejected — the interleaved chronological feed is more engaging and matches the "what's happening now" feel.

### 4. Swipeable cards via react-native-gesture-handler

Use `Swipeable` from react-native-gesture-handler for feed card interactions. Swipe right = interested/yes, swipe left = dismiss. This is already an Expo dependency, no new install needed.

**Alternative considered:** Custom pan gesture with Animated. Rejected — Swipeable provides the right UX primitives (spring-back, threshold detection, action rendering) out of the box.

### 5. Status broadcast sheet as modal bottom sheet (not new screen)

The broadcast flow is a bottom sheet triggered by a FAB, not a navigation push. This keeps the user's context (map or feed) visible behind it. Uses React Native Animated (same pattern as SpotCard) for the slide-up.

### 6. Circles as feed filter (not standalone screen)

Circles appear as filter pills at the top of the Feed. Selecting a circle filters broadcasts and activities to that circle's members. Creating a circle is done via a "+" button → bottom sheet with name input + member search. No separate circles tab or screen.

### 7. Supabase Realtime on status_broadcasts

Subscribe to `status_broadcasts` table changes (same pattern as existing `checkins` subscription) so the map and feed update live when friends broadcast.

### 8. Auto-conversion threshold for "down_if_others" posture

When an activity reaches 2+ "definitely_in" responses, all "down_if_others" users are auto-converted to confirmed (set `confirmed_at = now()`). Implemented as a Postgres function triggered on `activity_interest` INSERT/UPDATE.

### 9. Migration files, not schema.sql edits

Following the pattern established in Phase 1 completion: create `supabase/migrations/20260403_add_social_tables.sql` for incremental schema changes. The full `schema.sql` also gets updated for reference but migrations are what gets applied.

## Risks / Trade-offs

- **Feed performance with multiple queries** → Start with parallel fetches for broadcasts + activities + venues, merge client-side. If slow, consolidate into a single Postgres function returning a unified feed. Monitor before optimizing.

- **Swipeable cards may conflict with tab gesture** → React Native Gesture Handler's Swipeable is well-tested with tab navigators. If conflicts arise, wrap the FlatList in a GestureHandlerRootView.

- **Circle membership is invitation-only but no invite flow yet** → For now, circle creator adds members directly by searching profiles. Invite links come in a later phase.

- **No offline support for social features** → Broadcasts and activities require network. Acceptable for Phase 2 — offline caching comes in Phase 4 polish.
