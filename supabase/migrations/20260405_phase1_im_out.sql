-- Migration: Phase 1 — "I'm Out" core action
-- Adds: lat/lng columns, new status_type and duration values, UPDATE RLS policy

-- ── 1. Add lat/lng columns for easy coordinate access ──────
ALTER TABLE status_broadcasts ADD COLUMN IF NOT EXISTS lat float8;
ALTER TABLE status_broadcasts ADD COLUMN IF NOT EXISTS lng float8;

-- ── 2. Extend status_type CHECK to include walk and open ───
ALTER TABLE status_broadcasts DROP CONSTRAINT IF EXISTS status_broadcasts_status_type_check;
ALTER TABLE status_broadcasts ADD CONSTRAINT status_broadcasts_status_type_check
  CHECK (status_type IN ('out_now','up_for_drinks','up_for_dinner','grabbing_coffee','custom','walk','open'));

-- ── 3. Extend duration CHECK to include today and tonight ──
ALTER TABLE status_broadcasts DROP CONSTRAINT IF EXISTS status_broadcasts_duration_check;
ALTER TABLE status_broadcasts ADD CONSTRAINT status_broadcasts_duration_check
  CHECK (duration IN ('1h','until_2am','24h','today','tonight'));

-- ── 4. Add UPDATE RLS policy (needed for context/availability changes) ──
CREATE POLICY "Update own broadcasts"
  ON status_broadcasts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
