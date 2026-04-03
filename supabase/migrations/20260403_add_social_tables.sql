-- Migration: Phase 2 Social Layer
-- Adds: status_broadcasts, circles, circle_members, activities, activity_interest

-- ── STATUS BROADCASTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS status_broadcasts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles NOT NULL,
  status_type   text NOT NULL CHECK (status_type IN ('out_now','up_for_drinks','up_for_dinner','grabbing_coffee','custom')),
  custom_text   text,
  duration      text NOT NULL CHECK (duration IN ('1h','until_2am','24h')),
  expires_at    timestamptz NOT NULL,
  location      geography(Point, 4326),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX status_broadcasts_user_id_idx ON status_broadcasts(user_id);
CREATE INDEX status_broadcasts_expires_at_idx ON status_broadcasts(expires_at);

-- ── CIRCLES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS circles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  created_by      uuid REFERENCES profiles NOT NULL,
  streak_count    int DEFAULT 0,
  last_active_at  timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- ── CIRCLE MEMBERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS circle_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id   uuid REFERENCES circles ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES profiles NOT NULL,
  joined_at   timestamptz DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

CREATE INDEX circle_members_user_id_idx ON circle_members(user_id);

-- ── ACTIVITIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  uuid REFERENCES profiles NOT NULL,
  circle_id   uuid REFERENCES circles,
  title       text NOT NULL,
  venue_id    uuid REFERENCES venues,
  starts_at   timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- ── ACTIVITY INTEREST ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_interest (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles NOT NULL,
  activity_id   uuid REFERENCES activities ON DELETE CASCADE NOT NULL,
  posture       text NOT NULL CHECK (posture IN ('definitely_in','down_if_others','sell_me')),
  confirmed_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, activity_id)
);

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE status_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_interest ENABLE ROW LEVEL SECURITY;

-- status_broadcasts: read active, insert/delete own
CREATE POLICY "Read active broadcasts"
  ON status_broadcasts FOR SELECT
  TO authenticated
  USING (expires_at > now());

CREATE POLICY "Insert own broadcasts"
  ON status_broadcasts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Delete own broadcasts"
  ON status_broadcasts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- circles: members can read
CREATE POLICY "Members can read circles"
  ON circles FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated can create circles"
  ON circles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- circle_members: members can read, creator can insert
CREATE POLICY "Members can read memberships"
  ON circle_members FOR SELECT
  TO authenticated
  USING (
    circle_id IN (SELECT circle_id FROM circle_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Circle creator can add members"
  ON circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    circle_id IN (SELECT id FROM circles WHERE created_by = auth.uid())
  );

-- activities: authenticated read, insert own
CREATE POLICY "Authenticated can read activities"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Insert own activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- activity_interest: authenticated read, insert/update own
CREATE POLICY "Authenticated can read interest"
  ON activity_interest FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Insert own interest"
  ON activity_interest FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own interest"
  ON activity_interest FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── REALTIME ────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE status_broadcasts;

-- ── FUNCTIONS ───────────────────────────────────────────────

-- Auto-convert "down_if_others" postures when 2+ "definitely_in"
CREATE OR REPLACE FUNCTION auto_convert_postures()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_definitely_count int;
BEGIN
  -- Count definitely_in for this activity
  SELECT COUNT(*) INTO v_definitely_count
  FROM activity_interest
  WHERE activity_id = NEW.activity_id
    AND posture = 'definitely_in';

  -- If threshold met, convert all down_if_others
  IF v_definitely_count >= 2 THEN
    UPDATE activity_interest
    SET confirmed_at = now()
    WHERE activity_id = NEW.activity_id
      AND posture = 'down_if_others'
      AND confirmed_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_interest_change
  AFTER INSERT OR UPDATE ON activity_interest
  FOR EACH ROW
  EXECUTE FUNCTION auto_convert_postures();

-- Update circle streak on checkin
CREATE OR REPLACE FUNCTION update_circle_streak(p_circle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_had_yesterday boolean;
  v_last_active date;
BEGIN
  -- Check if any member checked in yesterday
  SELECT EXISTS(
    SELECT 1 FROM checkins c
    JOIN circle_members cm ON cm.user_id = c.user_id
    WHERE cm.circle_id = p_circle_id
      AND c.created_at::date = (CURRENT_DATE - 1)
  ) INTO v_had_yesterday;

  IF v_had_yesterday THEN
    UPDATE circles
    SET streak_count = streak_count + 1,
        last_active_at = now()
    WHERE id = p_circle_id;
  ELSE
    UPDATE circles
    SET streak_count = 1,
        last_active_at = now()
    WHERE id = p_circle_id;
  END IF;
END;
$$;
