-- ============================================================
-- Gather MVP — Tables, RLS, Realtime
-- ============================================================
-- Gathers are ephemeral coordinated meetups. Like broadcasts
-- they auto-expire, but they carry explicit invitations with
-- binary RSVP (in / out).
-- ============================================================

-- ── GATHERS ─────────────────────────────────────────────────

create table gathers (
  id                uuid primary key default gen_random_uuid(),
  created_by        uuid not null references profiles(id),
  title             text not null,
  status_type       text not null default 'open',
  custom_text       text,
  venue_name        text,
  location          geography(Point, 4326),
  lat               float8,
  lng               float8,
  starts_at         timestamptz,
  expires_at        timestamptz not null,
  audience_type     text not null default 'everyone'
                    check (audience_type in ('everyone', 'circle')),
  audience_circle_id uuid references circles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index idx_gathers_expires on gathers(expires_at);
create index idx_gathers_created_by on gathers(created_by);
create index idx_gathers_location on gathers using gist(location);

alter table gathers enable row level security;

-- Anyone authenticated can see active gathers (respecting audience)
create policy "Read active gathers"
  on gathers for select
  to authenticated
  using (
    expires_at > now()
    and (
      audience_type = 'everyone'
      or created_by = auth.uid()
      or audience_circle_id in (
        select circle_id from circle_members where user_id = auth.uid()
      )
    )
  );

-- Users can create their own gathers
create policy "Insert own gathers"
  on gathers for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Users can update their own gathers
create policy "Update own gathers"
  on gathers for update
  to authenticated
  using (auth.uid() = created_by);

-- Users can delete their own gathers
create policy "Delete own gathers"
  on gathers for delete
  to authenticated
  using (auth.uid() = created_by);

-- ── GATHER INVITES ──────────────────────────────────────────

create table gather_invites (
  id          uuid primary key default gen_random_uuid(),
  gather_id   uuid not null references gathers(id) on delete cascade,
  user_id     uuid not null references profiles(id),
  rsvp        text not null default 'pending'
              check (rsvp in ('pending', 'in', 'out')),
  created_at  timestamptz not null default now(),
  unique(gather_id, user_id)
);

create index idx_gather_invites_gather on gather_invites(gather_id);
create index idx_gather_invites_user on gather_invites(user_id);

alter table gather_invites enable row level security;

-- Can read invites for gathers you can see
create policy "Read gather invites"
  on gather_invites for select
  to authenticated
  using (exists (
    select 1 from gathers
    where id = gather_invites.gather_id
      and expires_at > now()
  ));

-- Users can insert invites for gathers they created, or RSVP themselves
create policy "Insert gather invites"
  on gather_invites for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from gathers
      where id = gather_invites.gather_id
        and created_by = auth.uid()
    )
  );

-- Users can update their own RSVP
create policy "Update own RSVP"
  on gather_invites for update
  to authenticated
  using (auth.uid() = user_id);

-- Users can delete their own invite, or host can remove invites
create policy "Delete gather invites"
  on gather_invites for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from gathers
      where id = gather_invites.gather_id
        and created_by = auth.uid()
    )
  );

-- ── REALTIME ────────────────────────────────────────────────

alter publication supabase_realtime add table gathers;
alter publication supabase_realtime add table gather_invites;
