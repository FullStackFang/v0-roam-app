-- ============================================================
-- Bonfire Dynamic Seed — call seed_around(lat, lng) from anywhere
-- Run this ONCE to install the functions, then call via app
-- ============================================================

-- ── Cleanup function ────────────────────────────────────────
CREATE OR REPLACE FUNCTION clear_seed_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM broadcast_joins WHERE broadcast_id IN (
    SELECT id FROM status_broadcasts WHERE user_id IN (
      SELECT id FROM profiles WHERE university_email LIKE '%@seed.cornell.edu'
    )
  );
  DELETE FROM status_broadcasts WHERE user_id IN (
    SELECT id FROM profiles WHERE university_email LIKE '%@seed.cornell.edu'
  );
  DELETE FROM profiles WHERE university_email LIKE '%@seed.cornell.edu';
  DELETE FROM auth.users WHERE email LIKE '%@seed.cornell.edu';
END;
$$;

-- ── Dynamic seed function ───────────────────────────────────
CREATE OR REPLACE FUNCTION seed_around(center_lat float8, center_lng float8)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_ids uuid[] := ARRAY[
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000008'
  ];
  names text[] := ARRAY[
    'Maya Patel', 'Jake Morrison', 'Priya Sharma', 'Noah Kim',
    'Sofia Reyes', 'Liam Chen', 'Ava Okonkwo', 'Ethan Russo'
  ];
  emails text[] := ARRAY[
    'maya.patel@seed.cornell.edu', 'jake.morrison@seed.cornell.edu',
    'priya.sharma@seed.cornell.edu', 'noah.kim@seed.cornell.edu',
    'sofia.reyes@seed.cornell.edu', 'liam.chen@seed.cornell.edu',
    'ava.okonkwo@seed.cornell.edu', 'ethan.russo@seed.cornell.edu'
  ];
  lat_offsets float8[] := ARRAY[
     0.0005,  0.0008,  0.0003,
    -0.0020, -0.0025,
     0.0030, -0.0035,  0.0015
  ];
  lng_offsets float8[] := ARRAY[
     0.0003, -0.0002,  0.0007,
     0.0025,  0.0030,
    -0.0040,  0.0050, -0.0060
  ];
  statuses text[] := ARRAY[
    'up_for_drinks', 'up_for_drinks', 'up_for_drinks',
    'grabbing_coffee', 'grabbing_coffee',
    'walk', 'open', 'up_for_dinner'
  ];
  durations text[] := ARRAY[
    '1h', '1h', 'tonight',
    '1h', 'today',
    '1h', 'tonight', '1h'
  ];
  expire_mins int[] := ARRAY[
    55, 42, 240,
    38, 180,
    48, 300, 30
  ];
  b_lat float8;
  b_lng float8;
  bid uuid;
BEGIN
  PERFORM clear_seed_data();

  FOR i IN 1..8 LOOP
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
    VALUES (user_ids[i], '00000000-0000-0000-0000-000000000000', emails[i],
            '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
            now(), now(), now(), 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO profiles (id, display_name, university_email)
    VALUES (user_ids[i], names[i], emails[i])
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  FOR i IN 1..8 LOOP
    b_lat := center_lat + lat_offsets[i];
    b_lng := center_lng + lng_offsets[i];

    INSERT INTO status_broadcasts (user_id, status_type, duration, expires_at, lat, lng)
    VALUES (
      user_ids[i],
      statuses[i],
      durations[i],
      now() + (expire_mins[i] || ' minutes')::interval,
      b_lat,
      b_lng
    );
  END LOOP;

  SELECT id INTO bid FROM status_broadcasts WHERE user_id = user_ids[1] LIMIT 1;
  IF bid IS NOT NULL THEN
    INSERT INTO broadcast_joins (broadcast_id, user_id) VALUES (bid, user_ids[2]);
    INSERT INTO broadcast_joins (broadcast_id, user_id) VALUES (bid, user_ids[3]);
  END IF;

  SELECT id INTO bid FROM status_broadcasts WHERE user_id = user_ids[4] LIMIT 1;
  IF bid IS NOT NULL THEN
    INSERT INTO broadcast_joins (broadcast_id, user_id) VALUES (bid, user_ids[5]);
  END IF;
END;
$$;

-- ── Grant RPC access ────────────────────────────────────────
GRANT EXECUTE ON FUNCTION seed_around(float8, float8) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_seed_data() TO authenticated;
