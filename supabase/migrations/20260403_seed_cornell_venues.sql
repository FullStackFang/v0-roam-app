-- Seed: Cornell/Ithaca venues
-- Run AFTER 20260403_add_profiles_and_loyalty.sql
-- Safe to re-run: deletes existing seed data first

-- ── Clear existing data ─────────────────────────────────────
DELETE FROM vibe_reports;
DELETE FROM checkins;
DELETE FROM venues;

-- ── Eat & Drink ─────────────────────────────────────────────
INSERT INTO venues (name, neighborhood, category, lat, lng, location) VALUES
  ('Collegetown Bagels',  'Collegetown',     'eatdrink', 42.4422, -76.4857, ST_Point(-76.4857, 42.4422)::geography),
  ('Chapter House',       'Collegetown',     'eatdrink', 42.4419, -76.4851, ST_Point(-76.4851, 42.4419)::geography),
  ('Rulloff''s',          'Collegetown',     'eatdrink', 42.4415, -76.4847, ST_Point(-76.4847, 42.4415)::geography),
  ('Level B',             'Collegetown',     'eatdrink', 42.4418, -76.4853, ST_Point(-76.4853, 42.4418)::geography),
  ('Plum Tree',           'Collegetown',     'eatdrink', 42.4424, -76.4844, ST_Point(-76.4844, 42.4424)::geography),
  ('Hai Hong',            'Collegetown',     'eatdrink', 42.4421, -76.4839, ST_Point(-76.4839, 42.4421)::geography),
  ('Moosewood',           'Downtown Ithaca', 'eatdrink', 42.4405, -76.4967, ST_Point(-76.4967, 42.4405)::geography),
  ('Ithaca Bakery',       'East Hill',       'eatdrink', 42.4445, -76.4888, ST_Point(-76.4888, 42.4445)::geography);

-- ── Happening ───────────────────────────────────────────────
INSERT INTO venues (name, neighborhood, category, lat, lng, location) VALUES
  ('The Nines',   'Collegetown',     'happening', 42.4413, -76.4849, ST_Point(-76.4849, 42.4413)::geography),
  ('The Range',   'Downtown Ithaca', 'happening', 42.4400, -76.4970, ST_Point(-76.4970, 42.4400)::geography),
  ('Silky Jones', 'Collegetown',     'happening', 42.4416, -76.4855, ST_Point(-76.4855, 42.4416)::geography),
  ('The Haunt',   'Downtown Ithaca', 'happening', 42.4392, -76.4971, ST_Point(-76.4971, 42.4392)::geography);

-- ── Move ────────────────────────────────────────────────────
INSERT INTO venues (name, neighborhood, category, lat, lng, location) VALUES
  ('Helen Newman Hall',   'Cornell Campus', 'move', 42.4531, -76.4779, ST_Point(-76.4779, 42.4531)::geography),
  ('Noyes Fitness Center', 'Cornell Campus', 'move', 42.4468, -76.4865, ST_Point(-76.4865, 42.4468)::geography),
  ('Teagle Hall',          'Cornell Campus', 'move', 42.4497, -76.4786, ST_Point(-76.4786, 42.4497)::geography);

-- ── Outside ─────────────────────────────────────────────────
INSERT INTO venues (name, neighborhood, category, lat, lng, location) VALUES
  ('Cornell Botanic Gardens', 'Cornell Campus',    'outside', 42.4520, -76.4708, ST_Point(-76.4708, 42.4520)::geography),
  ('Cascadilla Gorge',        'Collegetown',       'outside', 42.4445, -76.4865, ST_Point(-76.4865, 42.4445)::geography),
  ('Stewart Park',             'Ithaca Waterfront', 'outside', 42.4583, -76.5142, ST_Point(-76.5142, 42.4583)::geography),
  ('Ithaca Falls',             'Fall Creek',        'outside', 42.4530, -76.4940, ST_Point(-76.4940, 42.4530)::geography);

-- ── Focus ───────────────────────────────────────────────────
INSERT INTO venues (name, neighborhood, category, lat, lng, location) VALUES
  ('Libe Café',       'Cornell Campus', 'focus', 42.4479, -76.4843, ST_Point(-76.4843, 42.4479)::geography),
  ('Mann Library',    'Cornell Campus', 'focus', 42.4487, -76.4761, ST_Point(-76.4761, 42.4487)::geography),
  ('Olin Library',    'Cornell Campus', 'focus', 42.4477, -76.4841, ST_Point(-76.4841, 42.4477)::geography),
  ('Temple of Zeus',  'Cornell Campus', 'focus', 42.4498, -76.4826, ST_Point(-76.4826, 42.4498)::geography);

-- ── Mock checkins (no FK to auth.users — uses RLS bypass via service role) ──
-- NOTE: These require a real auth user. Skip this section if seeding
-- via SQL Editor. The checkins will be created by real users once the
-- app is running. The venues alone are enough to see markers on the map.
--
-- If you want demo checkins, sign up a test user first, then run:
--
--   INSERT INTO checkins (user_id, venue_id, vibe, activity_score, expires_at)
--   SELECT
--     '<your-test-user-uuid>',
--     v.id,
--     'buzzing',
--     0.8,
--     now() + interval '2 hours'
--   FROM venues v
--   WHERE v.name IN ('Chapter House', 'The Nines', 'Collegetown Bagels');
