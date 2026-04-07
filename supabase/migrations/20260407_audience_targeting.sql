-- ============================================================
-- Audience Targeting for Broadcasts
-- ============================================================
-- Adds audience_type and audience_circle_id to broadcasts.
-- Updates RLS so circle-targeted broadcasts are only visible
-- to circle members.
-- ============================================================

-- Add audience columns
alter table status_broadcasts
  add column if not exists audience_type text not null default 'everyone'
  check (audience_type in ('everyone', 'circle'));

alter table status_broadcasts
  add column if not exists audience_circle_id uuid references circles(id) on delete set null;

-- Replace the SELECT policy to enforce audience visibility
drop policy if exists "Read active broadcasts" on status_broadcasts;

create policy "Read active broadcasts"
  on status_broadcasts for select
  to authenticated
  using (
    expires_at > now()
    and (is_visible = true or user_id = auth.uid())
    and (
      audience_type = 'everyone'
      or user_id = auth.uid()
      or audience_circle_id in (
        select circle_id from circle_members where user_id = auth.uid()
      )
    )
  );
