## 1. Database: Social Tables Migration

- [x] 1.1 Create `supabase/migrations/20260403_add_social_tables.sql` with all 5 tables: status_broadcasts, circles, circle_members, activities, activity_interest — with CHECK constraints, foreign keys, unique constraints, and defaults
- [x] 1.2 Add RLS policies: status_broadcasts (read active, insert/delete own), circles + circle_members (members read, creator inserts), activities + activity_interest (authenticated read, insert/update own)
- [x] 1.3 Enable realtime on status_broadcasts: `ALTER PUBLICATION supabase_realtime ADD TABLE status_broadcasts`
- [x] 1.4 Create Postgres function `auto_convert_postures()` — on activity_interest INSERT/UPDATE, if activity has 2+ definitely_in, set confirmed_at on all down_if_others rows
- [x] 1.5 Create Postgres function `update_circle_streak(p_circle_id uuid)` — increment streak_count if consecutive-day activity, else reset to 1
- [x] 1.6 Add TypeScript types to `types/index.ts`: StatusBroadcast, Circle, CircleMember, Activity, ActivityInterest
- [x] 1.7 Add query functions to `lib/queries.ts`: fetchActiveBroadcasts, insertBroadcast, fetchCircles, createCircle, addCircleMember, searchProfiles, fetchActivities, createActivity, expressInterest, updateInterest, fetchFeedData

## 2. Tab Navigation

- [x] 2.1 Create `app/(tabs)/_layout.tsx` with bottom tab navigator — Map (MapPin icon) and Feed (List icon), minimal bar with no labels, accent/muted colors
- [x] 2.2 Move map screen to `app/(tabs)/map.tsx` — move contents of current `app/index.tsx`
- [x] 2.3 Create `app/(tabs)/feed.tsx` — placeholder Feed screen with "Feed coming soon" text
- [x] 2.4 Update `app/_layout.tsx` to render `(tabs)` group when authenticated (Slot already renders tabs group automatically)
- [x] 2.5 Replace old `app/index.tsx` with redirect to /(tabs)/map
- [x] 2.6 Verify tab switching works and map retains state when switching tabs

## 3. Status Broadcast

- [x] 3.1 Create `components/broadcast/StatusFAB.tsx` — floating action button, bottom-right, "+" icon, spring press animation
- [x] 3.2 Create `components/broadcast/BroadcastSheet.tsx` — bottom sheet with preset status pills (Out now, Up for drinks, Up for dinner, Grabbing coffee), custom text input, duration selector (1h, Until 2am, 24h), Broadcast button
- [x] 3.3 Wire BroadcastSheet to insert into status_broadcasts with computed expires_at, enforce max 3 active broadcasts
- [x] 3.4 Add StatusFAB to map tab screen, opening BroadcastSheet on tap
- [x] 3.5 Add broadcast avatar markers on RoamMap — fetch active broadcasts from circle members, render as avatar circles with glow ring at broadcast location
- [x] 3.6 Subscribe to realtime on status_broadcasts in RoamMap (same pattern as checkins subscription)

## 4. Feed Screen

- [x] 4.1 Create `components/feed/FeedCard.tsx` — discriminated union component switching on type: broadcast | activity | venue
- [x] 4.2 Create `components/feed/BroadcastCard.tsx` — friend avatar, name, status text, time remaining, distance
- [x] 4.3 Create `components/feed/ActivityCard.tsx` — title, venue, starts_at, posture avatar stacks with "X confirmed, Y deciding" text
- [x] 4.4 Create `components/feed/VenueCard.tsx` — venue name, category icon, loyalty indicator, "X friends here recently" with avatars
- [x] 4.5 Create `components/feed/FeedList.tsx` — FlatList fetching broadcasts + activities + venue signals, merged by recency, pull-to-refresh
- [x] 4.6 Create `components/feed/AvatarStack.tsx` — reusable avatar stack component showing named friends + "+N others" count
- [ ] 4.7 Add swipeable card interactions via react-native-gesture-handler Swipeable — right = interested, left = dismiss (deferred — needs device testing to tune gesture thresholds)
- [x] 4.8 Wire FeedList into `app/(tabs)/feed.tsx`

## 5. Commitment Postures

- [x] 5.1 Create `components/feed/PosturePicker.tsx` — bottom sheet with three options: "Definitely in" (green/checkmark), "Down if others are" (amber/people), "Sell me on it" (muted/question), spring animation
- [x] 5.2 Wire PosturePicker to insert into activity_interest with selected posture, set confirmed_at for definitely_in
- [x] 5.3 Add confirmation nudge banner to ActivityCard — shows "Still in for tonight?" when starts_at is within 2 hours, one-tap confirm/cancel

## 6. Circles

- [x] 6.1 Create `components/circles/CreateCircleSheet.tsx` — bottom sheet with name input, profile search field, selectable profile rows, Create button
- [x] 6.2 Create `components/feed/CircleFilterBar.tsx` — horizontal pill row at top of feed: "All" + one pill per circle with streak badge (flame + count)
- [x] 6.3 Wire circle filter to FeedList — filter broadcasts and activities to selected circle's members
- [x] 6.4 Add "+" button to feed header that opens CreateCircleSheet
- [x] 6.5 Wire CreateCircleSheet to createCircle + addCircleMember queries, auto-add creator as member

## 7. Verification

- [ ] 7.1 Apply migration to Supabase, verify all 5 tables exist with correct schema
- [ ] 7.2 Tab navigation works — Map and Feed tabs, switching preserves map state
- [ ] 7.3 Broadcast flow — tap FAB, select status + duration, broadcast appears on map for other users
- [ ] 7.4 Feed loads with mixed card types, swipe interactions work
- [ ] 7.5 Create a circle, verify feed filters by circle membership
- [ ] 7.6 Express interest in activity with posture, verify auto-conversion when threshold met
