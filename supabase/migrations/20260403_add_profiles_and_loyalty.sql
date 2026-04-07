-- Migration: Add profiles table, loyalty_score column, and auth trigger
-- Run this against an existing Bonfire database that already has venues/checkins/vibe_reports

-- ── 1. Add loyalty_score to venues ──────────────────────────
ALTER TABLE venues ADD COLUMN IF NOT EXISTS loyalty_score float8 DEFAULT 0;

-- ── 2. Create profiles table ────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name      text NOT NULL,
  avatar_url        text,
  university_email  text NOT NULL,
  created_at        timestamptz DEFAULT now()
);

-- ── 3. Profiles RLS ─────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 4. Auto-create profile on signup ────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  raw_name text;
  display  text;
BEGIN
  raw_name := split_part(NEW.email, '@', 1);
  raw_name := replace(replace(raw_name, '.', ' '), '_', ' ');
  display := initcap(raw_name);

  INSERT INTO public.profiles (id, display_name, university_email)
  VALUES (NEW.id, display, NEW.email);

  RETURN NEW;
END;
$$;

-- Drop trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
