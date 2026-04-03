## Why

The Phase 1 scaffold is ~85% complete — the map, markers, heatmap, filters, SpotCard vibe mechanic, auth screen, and realtime subscriptions all work. But the app can't run end-to-end as intended because it's missing a `profiles` table (no user identity beyond auth), venue seeds are NYC placeholders instead of Cornell campus, email enforcement is client-side only, and the `venues` table lacks the `loyalty_score` column needed for Phase 3. Closing these gaps now makes the app testable on a physical device with real Cornell data before layering social and loyalty features.

## What Changes

- Add `profiles` table to Supabase schema with `display_name`, `avatar_url`, `university_email`, and auto-creation trigger on signup
- Add `loyalty_score` float column to `venues` table (default 0, used by Phase 3 loyalty heatmap)
- Replace 8 NYC demo venues in `seed.ts` with 20+ real Cornell/Ithaca venues across all 5 categories, using accurate lat/lng
- Create Supabase Edge Function for server-side `@cornell.edu` email enforcement (reject non-Cornell signups at the database level)
- Create Postgres trigger to auto-insert a `profiles` row on `auth.users` INSERT
- Standardize category enum to `eatdrink` (current code convention) — no rename needed, just confirm alignment across schema, seeds, types, and components
- Add `Profile` TypeScript type and `fetchProfile`/`upsertProfile` query functions

## Capabilities

### New Capabilities
- `user-profiles`: User profile management — auto-creation on signup, display name, avatar URL, and profile queries
- `cornell-email-enforcement`: Server-side email domain restriction via Supabase Edge Function and database trigger
- `cornell-venue-seeds`: Cornell campus venue seed data with real locations across all 5 categories

### Modified Capabilities
_(none — no existing specs to modify)_

## Impact

- **Database**: New `profiles` table, new column on `venues`, new trigger function, new Edge Function
- **Schema file**: `supabase/schema.sql` gets profiles table + trigger + loyalty_score column
- **Seed file**: `supabase/seed.ts` complete rewrite with Cornell venues
- **TypeScript types**: `types/index.ts` gets `Profile` type
- **Query layer**: `lib/queries.ts` gets profile CRUD functions
- **New Edge Function**: `supabase/functions/enforce-cornell-email/index.ts`
- **No component changes** — existing UI components are unaffected in this phase
