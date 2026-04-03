## 1. Database Schema Updates

- [x] 1.1 Add `profiles` table to `supabase/schema.sql` with columns: id (uuid PK referencing auth.users), display_name (text NOT NULL), avatar_url (text nullable), university_email (text NOT NULL), created_at (timestamptz default now())
- [x] 1.2 Add RLS policies on `profiles`: all authenticated users can SELECT, users can UPDATE only their own row
- [x] 1.3 Add `loyalty_score float8 DEFAULT 0` column to `venues` table in `supabase/schema.sql`
- [x] 1.4 Create Postgres trigger function `handle_new_user()` that auto-inserts a `profiles` row on `auth.users` INSERT — derive display_name from email prefix (replace dots/underscores with spaces, title-case)
- [x] 1.5 Create the trigger: `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()`

## 2. TypeScript Types and Query Functions

- [x] 2.1 Add `Profile` interface to `types/index.ts` with fields: id, display_name, avatar_url, university_email, created_at
- [x] 2.2 Add `fetchProfile(userId: string)` function to `lib/queries.ts` — selects from profiles by id
- [x] 2.3 Add `upsertProfile(updates: Partial<Profile>)` function to `lib/queries.ts` — updates the authenticated user's profile row

## 3. Cornell Venue Seeds

- [x] 3.1 Rewrite `supabase/seed.ts` — replace all 8 NYC venues with 20+ Cornell/Ithaca venues across all 5 categories (eatdrink, happening, move, outside, focus) with real lat/lng and neighborhood labels
- [x] 3.2 Include required venues: Collegetown Bagels, Chapter House, Libe Café, Mann Library, Cornell Botanic Gardens, plus Rulloff's, Level B, The Nines, Helen Newman, Cascadilla Gorge, etc.
- [x] 3.3 Include mock checkins at 5+ venues with varying vibe values (buzzing/quiet/skip) and activity_score levels to demonstrate heatmap and marker animations

## 4. Server-Side Email Enforcement

- [x] 4.1 Create `supabase/functions/enforce-cornell-email/index.ts` — Deno Edge Function that checks email domain on auth.users INSERT webhook, deletes user row and returns 403 if not `@cornell.edu`
- [x] 4.2 Verify client-side email validation in `app/auth.tsx` is still in place as first line of defense

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and verify app compiles without TypeScript errors (also excluded supabase/functions from tsconfig since it's Deno)
- [ ] 5.2 Apply schema to Supabase (run schema.sql), run seed, verify Cornell venues appear on map
- [ ] 5.3 Sign up with a @cornell.edu email — verify profile auto-created with correct display_name
- [ ] 5.4 Tap a seeded venue — verify SpotCard opens with vibe data from mock checkins
