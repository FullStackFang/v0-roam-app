# Roam — Phased Implementation Guide

> Use this document to guide Claude Code through each phase. Start a conversation, paste the relevant phase section, and build incrementally. Each phase ends with a working, testable app.

---

## Current State (as of Phase 1 scaffold)

**What's built:**
- Expo 54 + React Native + TypeScript + NativeWind v4
- Expo Router with auth guard (`_layout.tsx` → `auth.tsx` / `index.tsx`)
- MapLibre map with animated pulsing venue markers + heatmap layer
- FilterBar (category pills), TimeToggle (tonight/weekend), TopBar (logo + location)
- SpotCard bottom sheet with Waze-style vibe reporting + decay bar + confirm/contradict
- Supabase client with AsyncStorage, realtime subscription on `checkins`
- Schema: `venues`, `checkins`, `vibe_reports` + PostGIS + RPC functions
- EAS Build config (dev/preview/production profiles)
- Cornell `@cornell.edu` email auth restriction (client-side)

**What's missing from Phase 1 to call it complete:**
- `profiles` table (display_name, avatar_url, university_email)
- `loyalty_score` column on `venues`
- Cornell campus seed venues (CTB, Chapter House, Libe Café, etc.) — current seeds are NYC
- Server-side email enforcement via Supabase Edge Function
- Category enum inconsistency: code uses `eatdrink`, spec says `eat_drink` — pick one and align everywhere

---

## Phase 1 Completion — Close the Scaffold Gaps

**Goal:** Finish the scaffold so the app runs end-to-end on a physical device with real Cornell data.

### 1.1 — Database: Add `profiles` table + update `venues`

```
Prompt for Claude Code:

Add a `profiles` table to the Supabase schema that auto-creates on user signup.
Schema: id (uuid, PK, references auth.users), display_name (text), avatar_url (text, nullable),
university_email (text), created_at (timestamptz). Add RLS: users can read all profiles,
users can update their own. Add a `loyalty_score` float column (default 0) to `venues`.

Update types/index.ts with a Profile type. Update lib/queries.ts with fetchProfile()
and upsertProfile() functions. Don't touch existing components yet.

Files to modify: supabase/schema.sql, types/index.ts, lib/queries.ts
```

### 1.2 — Seed: Cornell campus venues

```
Prompt for Claude Code:

Replace the NYC demo venues in supabase/seed.ts with real Cornell/Ithaca venues:
- Eat & Drink: CTB (Collegetown Bagels), Chapter House, Rulloff's, Level B, Plum Tree,
  Hai Hong, Moosewood, Ithaca Bakery
- Happening: The Nines, The Range, Silky Jones
- Move: Helen Newman, Noyes Fitness Center, Teagle Hall
- Outside: Cornell Botanic Gardens, Cascadilla Gorge, Stewart Park, Ithaca Falls
- Focus: Libe Café, Mann Library, Olin Library, Temple of Zeus

Use approximate lat/lng for each (center: 42.4534, -76.4735). Keep the mock checkins
approach but use Cornell venue IDs. Align category values with whatever the code uses
(currently 'eatdrink', 'happening', 'move', 'outside', 'focus').
```

### 1.3 — Auth: Server-side email enforcement

```
Prompt for Claude Code:

Create a Supabase Edge Function at supabase/functions/enforce-cornell-email/index.ts
that runs as a database webhook on auth.users INSERT. It should check that the user's
email ends with @cornell.edu. If not, delete the auth.users row and return 403.

Also create an auth trigger that auto-inserts a row into the profiles table when a
new user signs up, using their email and a default display_name derived from the
email prefix.
```

### 1.4 — Verify on device

```
Build and run on physical device:
1. npx expo start --android (or --ios)
2. Sign up with a @cornell.edu email
3. Verify map loads with Cornell venues
4. Tap a venue → SpotCard opens
5. Report a vibe → decay bar and confirmation work
6. Real-time: open on two devices, report vibe on one, see update on other
```

---

## Phase 2 — Social Layer

**Goal:** Add status broadcasts, the feed, activities with commitment postures, and circle foundations. This is the biggest phase — break it into sub-steps.

### 2.1 — Database: Social tables

```
Prompt for Claude Code:

Add these tables to supabase/schema.sql:

1. status_broadcasts: id (uuid PK), user_id (FK profiles), status_type (text, one of:
   out_now, up_for_drinks, up_for_dinner, grabbing_coffee, custom), custom_text (text nullable),
   duration (text, one of: 1h, until_2am, 24h), expires_at (timestamptz), location (geography
   Point nullable), created_at (timestamptz default now()).
   RLS: all authenticated can read active broadcasts, users insert own.

2. circles: id (uuid PK), name (text), created_by (FK profiles), streak_count (int default 0),
   last_active_at (timestamptz), created_at (timestamptz).
   RLS: members can read their circles.

3. circle_members: id (uuid PK), circle_id (FK circles), user_id (FK profiles),
   joined_at (timestamptz default now()).
   RLS: members can read, creator can insert.

4. activities: id (uuid PK), created_by (FK profiles), circle_id (FK circles nullable),
   title (text), venue_id (FK venues nullable), starts_at (timestamptz),
   created_at (timestamptz default now()).
   RLS: authenticated can read, users insert own.

5. activity_interest: id (uuid PK), user_id (FK profiles), activity_id (FK activities),
   posture (text, one of: definitely_in, down_if_others, sell_me),
   confirmed_at (timestamptz nullable), created_at (timestamptz default now()).
   RLS: authenticated can read, users insert/update own.

Enable realtime on status_broadcasts. Add TypeScript types to types/index.ts for all
new tables. Add query functions to lib/queries.ts for CRUD on each.
```

### 2.2 — Status Broadcast: FAB + broadcast flow

```
Prompt for Claude Code:

Build the status broadcast feature:

1. Create components/StatusFAB.tsx — a floating action button (bottom-right, above SpotCard)
   with a "+" icon. On press, opens a bottom sheet with:
   - Preset status pills: "Out now", "Up for drinks", "Up for dinner", "Grabbing coffee"
   - Custom text input field
   - Duration selector: "1 hour", "Until 2am", "24 hours"
   - "Broadcast" button that inserts into status_broadcasts with computed expires_at
   - Use spring animations for sheet open/close (match SpotCard pattern)

2. Show active broadcasts on the map: in RoamMap.tsx, fetch active status_broadcasts and
   render friend avatars with a subtle glow ring at their broadcast location (or near their
   last checkin if no location). Subscribe to realtime changes on status_broadcasts.

3. Add StatusFAB to app/index.tsx.

Style: match existing design system (theme colors, rounded pills, Playfair Display headings,
DM Sans body text). Keep it minimal.
```

### 2.3 — Feed screen

```
Prompt for Claude Code:

Create the Feed as a new tab in the app:

1. Add app/(tabs)/_layout.tsx with a bottom tab navigator (two tabs: Map, Feed).
   Move the current map screen to app/(tabs)/index.tsx.
   Create app/(tabs)/feed.tsx for the feed.
   Update app/_layout.tsx to render the tabs layout when authenticated.
   Tab bar: minimal, two icons (Map pin + list/feed icon from Lucide), accent color
   when active, muted when inactive. Keep it subtle — not a chunky tab bar.

2. Create components/feed/FeedCard.tsx — a unified card component that renders three
   card types based on a discriminated union:
   - StatusBroadcastCard: shows friend avatar, name, status text, time window, distance
   - ActivityCard: shows title, venue name, starts_at, commitment posture avatars
     (avatar stack with posture labels underneath)
   - VenueCard: shows venue name, category, loyalty score bar, "X friends have been here"

3. Create components/feed/FeedList.tsx — a FlatList that fetches and merges:
   - Active status broadcasts from circles
   - Upcoming activities
   - Venue signals (venues with high loyalty or recent friend activity)
   Sort by recency/relevance (broadcasts first, then activities, then venues).

4. Each card should have swipe actions (react-native-gesture-handler Swipeable):
   - Swipe right = interested/yes
   - Swipe left = dismiss
   - For status broadcasts: swipe right = "I'm down" (creates activity_interest)
   - For activities: swipe right = opens posture picker (definitely_in / down_if_others / sell_me)

Social proof on every card: avatar stacks showing people involved. Names for friends,
counts for extended network. Follow the principle "people over percentages."
```

### 2.4 — Commitment postures on activities

```
Prompt for Claude Code:

Build the commitment posture flow for activities:

1. Create components/feed/PosturePicker.tsx — a bottom sheet that appears when a user
   taps "Join" or swipes right on an activity card. Three options:
   - "Definitely in" — green accent, checkmark icon
   - "Down if others are" — amber, people icon
   - "Sell me on it" — muted, question mark icon
   Each inserts into activity_interest with the selected posture.

2. On the ActivityCard, show the commitment curve:
   - Avatar stack grouped by posture
   - Text like "3 confirmed, 1 deciding"
   - When a "down_if_others" threshold is met (2+ "definitely_in"), auto-convert
     those conditional users to confirmed (update confirmed_at)

3. Confirmation nudge: when starts_at is within 2 hours, show a banner on the card
   "Still in for tonight?" with one-tap confirm/cancel buttons.

Don't build push notifications yet — just the in-app UI.
```

### 2.5 — Circles foundation

```
Prompt for Claude Code:

Build the initial circles feature:

1. Create a way to create circles from the Feed. Add a "+" button in the feed header
   that opens a "New Circle" sheet: name input + invite friends (search profiles by name).
   On create: insert circle + circle_members rows.

2. Circles don't get their own tab or screen yet. They appear as:
   - A filter on the Feed ("All" / circle name pills at the top of feed)
   - When viewing a circle's feed, only broadcasts and activities from that circle show

3. Circle streak: increment streak_count when any member checks in on consecutive days.
   Create a Postgres function update_circle_streak(circle_id) that runs on checkin INSERT.
   Show streak count as a small flame + number on the circle filter pill.

No chat yet — circles are just scoped feeds at this point.
```

---

## Phase 3 — Loyalty Layer

**Goal:** Add the loyalty flywheel — "would go back" marks, repeat detection, lists, and loyalty-driven heatmap coloring.

### 3.1 — Database: Loyalty tables

```
Prompt for Claude Code:

Add these tables to supabase/schema.sql:

1. loyalty_marks: id (uuid PK), user_id (FK profiles), venue_id (FK venues),
   created_at (timestamptz default now()), UNIQUE(user_id, venue_id).
   RLS: authenticated can read all, users insert/delete own.

2. lists: id (uuid PK), user_id (FK profiles), name (text), is_public (boolean default false),
   created_at (timestamptz default now()).
   RLS: public lists readable by all, private by owner only. Owner can insert/update/delete.

3. list_items: id (uuid PK), list_id (FK lists), venue_id (FK venues),
   added_at (timestamptz default now()).
   RLS: follows parent list visibility.

Create a Postgres function compute_loyalty_score(venue_id) that calculates:
  loyalty_score = (loyalty_marks_count * 2 + repeat_visitors_count * 3) /
                  (total_unique_visitors + 1), normalized 0-1.
  Where repeat_visitor = user with 3+ checkins at that venue.

Create a trigger that recalculates loyalty_score on venues whenever loyalty_marks or
checkins are inserted.

Add TypeScript types and query functions for all new tables.
```

### 3.2 — "Would go back" on SpotCard

```
Prompt for Claude Code:

Add a "Would go back" button to the SpotCard component:

1. Below the vibe report section, add a new row with:
   - Heart/bookmark icon + "Would go back" text
   - If user has already marked this venue, show it as filled/active with "You'd go back"
   - Tap toggles the loyalty_mark (insert or delete)
   - Show count: "12 people would go back" with avatar stack of friends who marked it

2. Update the SpotCard to also show the venue's loyalty_score as a small bar or badge
   near the venue name. Use the heatmap color ramp (coral = high loyalty, teal = low).

3. Repeat check-in detection: in lib/queries.ts, add a function getUserCheckinCount(venueId)
   that returns the count of a user's lifetime checkins at a venue. If >= 3, auto-insert
   a loyalty_mark (if not already present) and show a toast: "You're a regular here!"
```

### 3.3 — Lists feature

```
Prompt for Claude Code:

Build the lists feature:

1. Create app/(tabs)/profile.tsx as a third tab (user icon). This screen shows:
   - User avatar, display_name, university email
   - "My Lists" section with cards for each list
   - "My Regulars" auto-generated list (venues with loyalty_mark = true)
   - "Create List" button

2. Create components/lists/ListCard.tsx — shows list name, venue count, top 3 venue
   thumbnails (or category icons), public/private badge.

3. Create app/list/[id].tsx — detail view for a list:
   - List name (editable), public/private toggle
   - Venue cards in a vertical scroll
   - "Add venue" button → search venues, add to list
   - Each venue shows loyalty indicators: your checkin count, "would go back" status

4. Share: each public list has a deep link (roam://list/{id}). When opened, shows the
   list with a "Save to my lists" button. Use Expo Linking for deep link handling.

Keep the profile tab minimal — it's not a social profile, it's a utility screen for
your own lists and settings.
```

### 3.4 — Loyalty-driven heatmap

```
Prompt for Claude Code:

Update the heatmap to use loyalty_score instead of raw activity:

1. Modify get_active_activity_points() to include loyalty_score in the weight calculation:
   weight = (activity_score * 0.4) + (loyalty_score * 0.6)
   This makes the heatmap favor loyal venues over just-busy venues.

2. Update the heatmap color ramp in RoamMap.tsx:
   - Coral-red (#E84428) = hot AND loyal
   - Amber (#F09040) = active but lower loyalty
   - Teal (#4DAAAC) = popular but low loyalty (tourist-trap signal)
   - Grey = insufficient data

3. Add a subtle badge on venue markers that have high loyalty (top 20%):
   a small star or crown icon overlaid on the marker dot.
```

---

## Phase 4 — Intelligence & Polish

**Goal:** Add smart features, push notifications, and quality-of-life polish. Only tackle this after Phases 1–3 are solid.

### 4.1 — Push notifications

```
Prompt for Claude Code:

Wire up Expo Notifications:

1. Create lib/notifications.ts with:
   - registerForPushNotifications() — request permission, get Expo push token,
     save to profiles table (add push_token column)
   - sendLocalNotification(title, body) helper

2. Create a Supabase Edge Function supabase/functions/send-push/index.ts that:
   - Receives a webhook payload (new checkin or broadcast from a circle member)
   - Looks up circle members' push tokens
   - Sends via Expo Push API: "2 people from [circle] just checked in at [venue]"

3. Trigger push for:
   - Circle member broadcasts availability
   - Activity reaches 3+ confirmed (nudge undecided members)
   - Venue you marked "would go back" has activity spike

Call registerForPushNotifications() in _layout.tsx after auth is confirmed.
```

### 4.2 — Proactive suggestions

```
Prompt for Claude Code:

Add smart suggestion toasts and cards:

1. After a user's 3rd checkin at the same venue, show a toast:
   "You keep coming back to [venue] — add to your regulars?"
   If tapped, auto-insert loyalty_mark.

2. In the feed, add a "Suggested" card type that surfaces:
   - Venues where 2+ friends have loyalty marks but user hasn't visited
   - Venues with high loyalty scores in categories the user frequents

3. "Tourist trap" indicator: on the SpotCard, if a venue has >80% first-time visitors
   (low repeat rate), show a subtle "Mostly first-timers" label. This is the
   anti-signal to the loyalty score.

Keep suggestion logic in lib/suggestions.ts — pure functions that take venues,
checkins, loyalty_marks arrays and return suggestion cards.
```

### 4.3 — Polish pass

```
Prompt for Claude Code:

Polish pass across the app:

1. Loading states: add skeleton screens for map data loading and feed loading.
   Use Animated opacity pulse (not spinners).

2. Empty states: when feed has no items, show an illustration + "Your circles are quiet.
   Be the first to broadcast." When no checkins at a venue, show "No vibes yet — be first."

3. Haptic feedback: add expo-haptics. Light tap on filter selection, medium on vibe report,
   success on broadcast sent.

4. Offline handling: cache last-fetched venues and checkins in AsyncStorage.
   Show cached data with a subtle "Offline" banner when no connection.

5. Pull-to-refresh on the feed.

6. App icon and splash screen: update assets/ with final Roam branding.
```

---

## Phase 5 — Cornell Launch

**Goal:** Production-ready for Cornell campus deployment.

### 5.1 — Server-side hardening

```
Prompt for Claude Code:

Harden for production:

1. Server-side email enforcement: ensure the Supabase Edge Function from 1.3 is deployed
   and tested. No client-side-only checks.

2. Rate limiting: add rate limits on checkins (max 1 per venue per hour per user),
   broadcasts (max 3 active at once), and vibe reports (max 1 per checkin per user).
   Implement as Postgres constraints or Edge Function middleware.

3. Data cleanup: create a Supabase cron job (pg_cron) that deletes expired checkins
   and broadcasts older than 24 hours.

4. RLS audit: review all RLS policies. Ensure no data leaks — users should never see
   other users' private lists, and circle data should be scoped to members.
```

### 5.2 — Cornell venue seeding (production)

```
Prompt for Claude Code:

Create a proper venue ingestion pipeline:

1. Create a script scripts/seed-cornell-venues.ts that uses the Google Places API to:
   - Search for venues near Cornell campus (42.4534, -76.4735, radius 3km)
   - Map Google place types to Roam categories
   - Insert into Supabase venues table with google_place_id for dedup
   - Run idempotently (skip existing google_place_ids)

2. Include 50+ real venues across all 5 categories. Cover:
   - Collegetown, Downtown Ithaca, Cornell campus, East Hill
   - Restaurants, bars, cafés, gyms, libraries, parks, event spaces

3. Add this as an npm script: "seed:cornell" in package.json.
```

### 5.3 — App Store submission

```
Prompt for Claude Code:

Prepare for App Store + Play Store submission:

1. Update app.json with final metadata:
   - Version 1.0.0
   - Privacy policy URL (create a simple privacy policy page)
   - App Store category: Social Networking

2. Create app store screenshots using Expo's screenshot tool or manually:
   - Map view with active venues
   - SpotCard with vibe reporting
   - Feed with status broadcasts
   - Profile with lists

3. Run: eas build --profile production --platform all
4. Run: eas submit --platform ios && eas submit --platform android

5. Add a Supabase Edge Function for App Store review: detect if the reviewer's
   email doesn't match @cornell.edu and allow them through with limited access
   (read-only, can't broadcast or checkin).
```

---

## Phase Dependencies

```
Phase 1 (completion) → no blockers, do this now
Phase 2.1 (social tables) → depends on 1.1 (profiles)
Phase 2.2 (broadcasts) → depends on 2.1
Phase 2.3 (feed) → depends on 2.1, 2.2
Phase 2.4 (postures) → depends on 2.3
Phase 2.5 (circles) → depends on 2.1
Phase 3.1 (loyalty tables) → depends on 1.1
Phase 3.2 (would go back) → depends on 3.1
Phase 3.3 (lists) → depends on 3.1
Phase 3.4 (loyalty heatmap) → depends on 3.1
Phase 4.* → depends on Phases 2 + 3
Phase 5.* → depends on all above
```

## How to Use This Document

1. **One sub-phase per conversation.** Paste the relevant prompt block into a new Claude Code session.
2. **Test after each sub-phase.** Run on device, verify the feature works end-to-end before moving on.
3. **Update CLAUDE.md** after each phase — add new tables, components, and patterns to keep future sessions informed.
4. **Commit after each sub-phase.** One commit per deliverable keeps the git history clean and rollback-friendly.
