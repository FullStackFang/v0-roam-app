## Why

Phase 1 gave Roam a live map with venues and vibes. But Roam's core thesis is that **the social reporting layer is the product** — the map is just infrastructure. Right now users can check in and report vibes, but there's no way to see what friends are doing, broadcast availability, commit to activities, or organize around circles. Without the social flywheel, the map is a passive viewer instead of a live social layer. Phase 2 adds the social primitives that make the map come alive with people.

## What Changes

- Add 5 new database tables: `status_broadcasts`, `circles`, `circle_members`, `activities`, `activity_interest`
- Add new TypeScript types and Supabase query functions for all social entities
- Add **Status Broadcast** — FAB button to broadcast availability with preset/custom statuses and auto-expiry
- Add **Feed screen** — new tab with a unified card-based stream of broadcasts, activities, and venue signals
- Add **tab navigation** — bottom tabs (Map + Feed) replacing the current single-screen layout
- Add **Commitment Postures** — when joining an activity, users pick definitely_in / down_if_others / sell_me with auto-conversion at threshold
- Add **Circles foundation** — create circles, filter feed by circle, circle streaks from consecutive check-ins
- Show friend broadcast avatars on the map with glow effect
- Add swipeable card interactions on feed (interested / dismiss)
- Social proof avatar stacks on all card types

## Capabilities

### New Capabilities
- `social-tables`: Database schema for status_broadcasts, circles, circle_members, activities, activity_interest with RLS and realtime
- `status-broadcast`: FAB button, broadcast sheet, preset/custom statuses, duration picker, auto-expiry, map avatar glow
- `feed`: Tab navigation, unified feed screen, card types (broadcast/activity/venue), swipeable interactions, social proof
- `commitment-postures`: Posture picker (definitely_in/down_if_others/sell_me), posture display on cards, auto-conversion, confirmation nudges
- `circles`: Circle creation, circle feed filtering, circle streaks, member management

### Modified Capabilities
_(none — no existing specs to modify)_

## Impact

- **Database**: 5 new tables, new RLS policies, realtime on status_broadcasts
- **Navigation**: Convert from single screen to tab layout (Expo Router `(tabs)` group)
- **New screens**: Feed tab, circle creation sheet
- **New components**: StatusFAB, FeedCard variants, PosturePicker, FeedList, CircleFilterBar
- **Modified components**: RoamMap (broadcast avatars), index.tsx (tab restructure)
- **New dependencies**: May need `react-native-gesture-handler` Swipeable for card interactions
- **Query layer**: Significant additions to `lib/queries.ts` for all social CRUD operations
- **Types**: New types for all social entities in `types/index.ts`
