-- Migration: Phase 4 — Launch Prep
-- Push notifications, fuzzy location, invisible mode, Cornell seed

-- ── pg_net for server-side push ─────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ── Profiles: push token + last known location ──────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_known_lat float8;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_known_lng float8;

-- ── Broadcasts: fuzzy location + invisible mode ─────────────
ALTER TABLE status_broadcasts ADD COLUMN IF NOT EXISTS fuzzy_lat float8;
ALTER TABLE status_broadcasts ADD COLUMN IF NOT EXISTS fuzzy_lng float8;
ALTER TABLE status_broadcasts ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- ── Fuzzy location trigger ──────────────────────────────────
-- Deterministic jitter ±0.0015° (~150m) seeded from broadcast UUID
CREATE OR REPLACE FUNCTION compute_fuzzy_location()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  seed int := ('x' || substr(NEW.id::text, 1, 8))::bit(32)::int;
  jitter float8 := 0.0015;
BEGIN
  IF NEW.lat IS NULL OR NEW.lng IS NULL THEN
    NEW.fuzzy_lat := NULL;
    NEW.fuzzy_lng := NULL;
    RETURN NEW;
  END IF;

  NEW.fuzzy_lat := NEW.lat + (((seed % 1000)::float8 / 500.0) - 1.0) * jitter;
  NEW.fuzzy_lng := NEW.lng + ((((seed / 1000) % 1000)::float8 / 500.0) - 1.0) * jitter;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_fuzzy_location
  BEFORE INSERT ON status_broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION compute_fuzzy_location();

-- ── Invisible mode: update RLS ──────────────────────────────
DROP POLICY IF EXISTS "Read active broadcasts" ON status_broadcasts;

CREATE POLICY "Read active broadcasts"
  ON status_broadcasts FOR SELECT
  TO authenticated
  USING (
    expires_at > now()
    AND (is_visible = true OR user_id = auth.uid())
  );

-- ── Push: notify on join ────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_token text;
  v_joiner_name text;
BEGIN
  SELECT p.push_token INTO v_owner_token
  FROM status_broadcasts sb
  JOIN profiles p ON p.id = sb.user_id
  WHERE sb.id = NEW.broadcast_id
    AND sb.expires_at > now()
    AND p.push_token IS NOT NULL;

  IF v_owner_token IS NULL THEN RETURN NEW; END IF;

  SELECT display_name INTO v_joiner_name
  FROM profiles WHERE id = NEW.user_id;

  PERFORM net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json'
    ),
    body := jsonb_build_object(
      'to', v_owner_token,
      'title', 'Someone joined!',
      'body', COALESCE(v_joiner_name, 'Someone') || ' joined your broadcast',
      'data', jsonb_build_object('type', 'join', 'broadcast_id', NEW.broadcast_id),
      'sound', 'default',
      'channelId', 'joins'
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_broadcast_join_notify
  AFTER INSERT ON broadcast_joins
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_join();

-- ── Push: notify nearby users on new broadcast ──────────────
CREATE OR REPLACE FUNCTION notify_nearby_on_broadcast()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_name text;
  v_rec RECORD;
  v_count int := 0;
BEGIN
  IF NEW.lat IS NULL OR NEW.lng IS NULL THEN RETURN NEW; END IF;

  SELECT display_name INTO v_name FROM profiles WHERE id = NEW.user_id;

  FOR v_rec IN
    SELECT p.push_token
    FROM profiles p
    WHERE p.push_token IS NOT NULL
      AND p.id != NEW.user_id
      AND p.last_known_lat IS NOT NULL
      AND ST_DWithin(
        ST_MakePoint(p.last_known_lng, p.last_known_lat)::geography,
        ST_MakePoint(NEW.lng, NEW.lat)::geography,
        1500
      )
  LOOP
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
      ),
      body := jsonb_build_object(
        'to', v_rec.push_token,
        'title', 'Activity nearby',
        'body', COALESCE(v_name, 'Someone') || ' is out near you',
        'data', jsonb_build_object('type', 'nearby', 'broadcast_id', NEW.id),
        'sound', 'default',
        'channelId', 'nearby'
      )
    );
    v_count := v_count + 1;
    EXIT WHEN v_count >= 50;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_broadcast_created_notify_nearby
  AFTER INSERT ON status_broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION notify_nearby_on_broadcast();

-- ── Cornell launch seed function ────────────────────────────
CREATE OR REPLACE FUNCTION seed_cornell_launch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uids uuid[] := ARRAY[
    'b1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000004',
    'b1000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000006',
    'b1000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000008',
    'b1000000-0000-0000-0000-000000000009','b1000000-0000-0000-0000-000000000010',
    'b1000000-0000-0000-0000-000000000011','b1000000-0000-0000-0000-000000000012',
    'b1000000-0000-0000-0000-000000000013','b1000000-0000-0000-0000-000000000014',
    'b1000000-0000-0000-0000-000000000015','b1000000-0000-0000-0000-000000000016',
    'b1000000-0000-0000-0000-000000000017','b1000000-0000-0000-0000-000000000018',
    'b1000000-0000-0000-0000-000000000019','b1000000-0000-0000-0000-000000000020'
  ];
  names text[] := ARRAY[
    'Anika Mehta','Tyler Brooks','Zara Okafor','Kai Tanaka',
    'Luna Castillo','Marcus Webb','Diya Anand','Owen Pearce',
    'Nia Baptiste','Felix Huang','Amara Diop','Declan Fitz',
    'Sadie Ng','Rohan Kapoor','Mila Rossi','Ezra Goldstein',
    'Preet Kaur','Caleb Strand','Yara Farid','Leo Voss'
  ];
  emails text[];
  -- Collegetown drinks cluster (3 people, ~150m apart)
  lats float8[] := ARRAY[
    42.4422, 42.4419, 42.4416,
    42.4534, 42.4538,
    42.4490, 42.4495,
    42.4450, 42.4460,
    42.4405,
    42.4500, 42.4480, 42.4445,
    42.4530, 42.4470,
    42.4410, 42.4435, 42.4520, 42.4455, 42.4440
  ];
  lngs float8[] := ARRAY[
    -76.4857, -76.4851, -76.4847,
    -76.4735, -76.4725,
    -76.4780, -76.4775,
    -76.4888, -76.4870,
    -76.4967,
    -76.4750, -76.4800, -76.4840,
    -76.4710, -76.4760,
    -76.4960, -76.4830, -76.4740, -76.4810, -76.4850
  ];
  statuses text[] := ARRAY[
    'up_for_drinks','up_for_drinks','up_for_drinks',
    'grabbing_coffee','grabbing_coffee',
    'walk','walk',
    'open','open',
    'up_for_dinner',
    'grabbing_coffee','walk','open',
    'up_for_drinks','up_for_drinks',
    'up_for_dinner','grabbing_coffee','walk','open','up_for_drinks'
  ];
  durs text[] := ARRAY[
    '1h','1h','tonight',
    '1h','today',
    '1h','1h',
    'tonight','1h',
    '1h',
    'today','1h','tonight',
    '1h','1h',
    'tonight','1h','today','1h','tonight'
  ];
  mins int[] := ARRAY[
    55,42,240,38,180,48,35,300,45,30,
    120,40,200,50,38,250,42,150,55,220
  ];
  bid uuid;
BEGIN
  -- Build emails
  emails := ARRAY[]::text[];
  FOR i IN 1..20 LOOP
    emails := array_append(emails, lower(replace(names[i], ' ', '.')) || '@seed.cornell.edu');
  END LOOP;

  -- Clean previous launch seed
  DELETE FROM broadcast_joins WHERE broadcast_id IN (
    SELECT id FROM status_broadcasts WHERE user_id = ANY(uids)
  );
  DELETE FROM status_broadcasts WHERE user_id = ANY(uids);
  DELETE FROM profiles WHERE id = ANY(uids);
  DELETE FROM auth.users WHERE id = ANY(uids);

  -- Create users + profiles
  FOR i IN 1..20 LOOP
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES (uids[i], '00000000-0000-0000-0000-000000000000', emails[i],
            '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
            now(), now(), now(), 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO profiles (id, display_name, university_email)
    VALUES (uids[i], names[i], emails[i])
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- Create broadcasts
  FOR i IN 1..20 LOOP
    INSERT INTO status_broadcasts (user_id, status_type, duration, expires_at, lat, lng)
    VALUES (uids[i], statuses[i], durs[i], now() + (mins[i] || ' minutes')::interval, lats[i], lngs[i]);
  END LOOP;

  -- Joins: create forming states
  -- Tyler+Zara join Anika's drinks (Collegetown cluster)
  SELECT id INTO bid FROM status_broadcasts WHERE user_id = uids[1] LIMIT 1;
  IF bid IS NOT NULL THEN
    INSERT INTO broadcast_joins (broadcast_id, user_id) VALUES (bid, uids[2]);
    INSERT INTO broadcast_joins (broadcast_id, user_id) VALUES (bid, uids[3]);
  END IF;
  -- Luna joins Kai's coffee (campus cluster)
  SELECT id INTO bid FROM status_broadcasts WHERE user_id = uids[4] LIMIT 1;
  IF bid IS NOT NULL THEN
    INSERT INTO broadcast_joins (broadcast_id, user_id) VALUES (bid, uids[5]);
  END IF;
  -- Owen joins Diya's walk
  SELECT id INTO bid FROM status_broadcasts WHERE user_id = uids[7] LIMIT 1;
  IF bid IS NOT NULL THEN
    INSERT INTO broadcast_joins (broadcast_id, user_id) VALUES (bid, uids[8]);
  END IF;
  -- Felix joins Nia's coffee
  SELECT id INTO bid FROM status_broadcasts WHERE user_id = uids[9] LIMIT 1;
  IF bid IS NOT NULL THEN
    INSERT INTO broadcast_joins (broadcast_id, user_id) VALUES (bid, uids[10]);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION seed_cornell_launch() TO authenticated;
