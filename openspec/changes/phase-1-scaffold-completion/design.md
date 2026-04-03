## Context

The Roam app scaffold has a working map screen with MapLibre, animated venue markers, heatmap layer, category/time filters, SpotCard with Waze-style vibe reporting, Supabase realtime on checkins, and a client-side Cornell email auth screen. The database has three tables (`venues`, `checkins`, `vibe_reports`) with PostGIS and RPC functions.

Missing pieces: no `profiles` table (user identity is just `auth.users` UUID), venue seeds are 8 NYC demo locations, email enforcement is client-side only, and `venues` lacks `loyalty_score` for Phase 3.

## Goals / Non-Goals

**Goals:**
- App runs end-to-end on a physical device with real Cornell campus data
- Every authenticated user has a `profiles` row auto-created on signup
- Non-Cornell emails are rejected at the database/server level, not just the client
- Schema is forward-compatible with Phase 2 (social) and Phase 3 (loyalty)

**Non-Goals:**
- No UI changes to existing components (map, SpotCard, filters all stay as-is)
- No new screens or navigation changes
- No loyalty computation logic yet — just the `loyalty_score` column placeholder
- No avatar upload or profile editing UI — just the data layer

## Decisions

### 1. Profiles table with auth trigger (not Edge Function for profile creation)

Use a Postgres trigger on `auth.users` INSERT to auto-create profiles rows. This is simpler and more reliable than an Edge Function for profile creation — it runs in the same transaction as the auth signup.

**Alternative considered:** Edge Function webhook on signup. Rejected because it introduces latency and a failure mode where auth succeeds but profile creation fails.

The trigger extracts `display_name` from the email prefix (everything before `@`), replacing dots and underscores with spaces and title-casing.

### 2. Edge Function for email enforcement (not Postgres check constraint)

Use a Supabase Edge Function triggered by a database webhook on `auth.users` INSERT to enforce `@cornell.edu` emails. If the email doesn't match, the function deletes the `auth.users` row and returns 403.

**Alternative considered:** Postgres trigger that raises an exception on non-Cornell emails. Rejected because Supabase Auth creates the user before custom triggers run, so a failed trigger would leave the auth system in an inconsistent state. The Edge Function approach cleanly removes the user after creation.

**Alternative considered:** Supabase Auth hook (custom access token). This would be cleaner but requires Supabase Pro plan features that may not be available.

### 3. Keep `eatdrink` category convention (no rename)

The codebase consistently uses `eatdrink`, `happening`, `move`, `outside`, `focus` across schema CHECK constraints, seed data, TypeScript types, component configs, and filter bar. The project prompt spec uses `eat_drink` but the actual implementation settled on `eatdrink`. Renaming now would touch every file for no functional benefit. Standardize on `eatdrink`.

### 4. Seed with 20+ real Cornell venues using hardcoded coordinates

Hardcode lat/lng for known Cornell campus and Ithaca venues rather than calling Google Places API at seed time. The API call adds complexity, cost, and a runtime dependency for seed data. Google Places ingestion is deferred to Phase 5 for production venue seeding.

### 5. loyalty_score as a denormalized column with default 0

Add `loyalty_score float8 DEFAULT 0` to `venues` rather than computing it on read. Phase 3 will add triggers to recompute it. For now it's a no-op placeholder that doesn't affect any queries or UI.

## Risks / Trade-offs

- **Edge Function email enforcement has a race window** — between auth.users INSERT and the Edge Function deleting the row, the user briefly exists. Mitigation: the profiles trigger runs first (same transaction), and the profile will also be deleted when the auth user is removed. Client-side validation remains as the first line of defense.

- **Hardcoded seed coordinates may drift** — if venues move or close, seeds become stale. Mitigation: seeds are only for development/demo. Production will use Google Places ingestion (Phase 5).

- **No profile editing UI** — users get an auto-generated display name they can't change yet. Mitigation: acceptable for Phase 1. Profile editing can be added in Phase 3 when the profile tab is built.
