-- ============================================================
-- Roam — Supabase Schema
-- ============================================================

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── VENUES ───────────────────────────────────────────────────
CREATE TABLE venues (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  neighborhood  text,
  category      text NOT NULL CHECK (category IN ('eatdrink','happening','move','outside','focus')),
  location      geography(Point, 4326) NOT NULL,
  lat           float8 NOT NULL,
  lng           float8 NOT NULL,
  google_place_id text UNIQUE,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX venues_location_idx ON venues USING GIST(location);

-- ── CHECKINS ─────────────────────────────────────────────────
CREATE TABLE checkins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users NOT NULL,
  venue_id        uuid REFERENCES venues NOT NULL,
  vibe            text NOT NULL CHECK (vibe IN ('buzzing','quiet','skip')),
  activity_score  float8 DEFAULT 0.5,
  expires_at      timestamptz NOT NULL DEFAULT now() + interval '2 hours',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX checkins_venue_id_idx ON checkins(venue_id);
CREATE INDEX checkins_expires_at_idx ON checkins(expires_at);

-- ── VIBE REPORTS ─────────────────────────────────────────────
CREATE TABLE vibe_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id  uuid REFERENCES checkins NOT NULL,
  user_id     uuid REFERENCES auth.users NOT NULL,
  confirmed   boolean NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ── FUNCTIONS ────────────────────────────────────────────────

-- Returns GeoJSON FeatureCollection of active checkins for heatmap
CREATE OR REPLACE FUNCTION get_active_activity_points()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(jsonb_agg(
      jsonb_build_object(
        'type', 'Feature',
        'geometry', jsonb_build_object(
          'type', 'Point',
          'coordinates', jsonb_build_array(v.lng, v.lat)
        ),
        'properties', jsonb_build_object(
          'weight', c.activity_score,
          'venue_id', c.venue_id
        )
      )
    ), '[]'::jsonb)
  )
  FROM checkins c
  JOIN venues v ON v.id = c.venue_id
  WHERE c.expires_at > now();
$$;

-- Computes normalized activity score for a venue
CREATE OR REPLACE FUNCTION compute_activity_score(p_venue_id uuid)
RETURNS float8
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  checkin_count int;
  confirm_count int;
  raw_score float8;
BEGIN
  SELECT COUNT(*) INTO checkin_count
  FROM checkins
  WHERE venue_id = p_venue_id
    AND expires_at > now();

  SELECT COUNT(*) INTO confirm_count
  FROM vibe_reports vr
  JOIN checkins c ON c.id = vr.checkin_id
  WHERE c.venue_id = p_venue_id
    AND c.expires_at > now()
    AND vr.confirmed = true;

  raw_score := (checkin_count * 1.0) + (confirm_count * 0.5);

  -- Normalize to 0-1 (cap at 10 for normalization)
  RETURN LEAST(raw_score / 10.0, 1.0);
END;
$$;

-- Confirm a vibe (insert report + refresh score)
CREATE OR REPLACE FUNCTION confirm_vibe(p_checkin_id uuid, p_user_id uuid, p_confirmed boolean)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_venue_id uuid;
  v_new_score float8;
BEGIN
  INSERT INTO vibe_reports (checkin_id, user_id, confirmed)
  VALUES (p_checkin_id, p_user_id, p_confirmed);

  SELECT venue_id INTO v_venue_id FROM checkins WHERE id = p_checkin_id;

  v_new_score := compute_activity_score(v_venue_id);

  UPDATE checkins
  SET activity_score = v_new_score
  WHERE venue_id = v_venue_id
    AND expires_at > now();
END;
$$;

-- ── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_reports ENABLE ROW LEVEL SECURITY;

-- Venues: everyone can read
CREATE POLICY "Venues are viewable by everyone"
  ON venues FOR SELECT
  USING (true);

-- Checkins: everyone can read active, users can insert their own
CREATE POLICY "Active checkins are viewable by everyone"
  ON checkins FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Users can insert their own checkins"
  ON checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins"
  ON checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- Vibe reports: everyone can read, users insert their own
CREATE POLICY "Vibe reports are viewable by everyone"
  ON vibe_reports FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own vibe reports"
  ON vibe_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── REALTIME ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE checkins;
