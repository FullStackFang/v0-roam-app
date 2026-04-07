-- ============================================================
-- Avatar Rewards & Milestone System
-- ============================================================
-- Tracks earned milestones (badges, accessories) and the
-- user's equipped cosmetic configuration.
-- ============================================================

-- ── user_rewards: every milestone a user has unlocked ────────

create table if not exists user_rewards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  reward_key  text not null,          -- e.g. 'prometheus', 'spark', 'firekeeper'
  reward_type text not null check (reward_type in ('badge', 'accessory', 'border')),
  unlocked_at timestamptz not null default now(),
  unique (user_id, reward_key)
);

alter table user_rewards enable row level security;

-- Authenticated users can read their own rewards
create policy "Users read own rewards"
  on user_rewards for select
  to authenticated
  using (user_id = auth.uid());

-- Authenticated users can read rewards of any user (for badge display on avatars)
create policy "Users read all rewards"
  on user_rewards for select
  to authenticated
  using (true);

-- Only the server (service role) or the user themselves inserts rewards
create policy "Users insert own rewards"
  on user_rewards for insert
  to authenticated
  with check (user_id = auth.uid());

-- ── avatar_config: what the user has equipped ────────────────

create table if not exists avatar_config (
  user_id           uuid primary key references profiles(id) on delete cascade,
  equipped_badge     text,            -- reward_key of equipped badge (nullable = none)
  equipped_accessory text,            -- reward_key of equipped accessory
  equipped_border    text,            -- reward_key of equipped border/glow
  updated_at        timestamptz not null default now()
);

alter table avatar_config enable row level security;

create policy "Users read all avatar configs"
  on avatar_config for select
  to authenticated
  using (true);

create policy "Users update own avatar config"
  on avatar_config for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own avatar config"
  on avatar_config for insert
  to authenticated
  with check (user_id = auth.uid());

-- Auto-create avatar_config row when a profile is created
create or replace function handle_new_avatar_config()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into avatar_config (user_id) values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_profile_created_avatar_config
  after insert on profiles
  for each row
  execute function handle_new_avatar_config();
