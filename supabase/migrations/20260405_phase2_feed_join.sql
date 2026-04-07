-- Migration: Phase 2 — Feed + Join
-- Adds: broadcast_joins table for frictionless joining of broadcasts

-- ── BROADCAST JOINS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_joins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id  uuid NOT NULL REFERENCES status_broadcasts(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(broadcast_id, user_id)
);

CREATE INDEX idx_broadcast_joins_broadcast ON broadcast_joins(broadcast_id);
CREATE INDEX idx_broadcast_joins_user ON broadcast_joins(user_id);

-- ── RLS ────────────────────────────────────────────────────

ALTER TABLE broadcast_joins ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see joins on active broadcasts
CREATE POLICY "Read joins on active broadcasts"
  ON broadcast_joins FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM status_broadcasts
    WHERE id = broadcast_joins.broadcast_id AND expires_at > now()
  ));

-- Users can join broadcasts
CREATE POLICY "Insert own joins"
  ON broadcast_joins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can leave broadcasts
CREATE POLICY "Delete own joins"
  ON broadcast_joins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── REALTIME ───────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE broadcast_joins;
