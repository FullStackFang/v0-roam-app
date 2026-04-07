-- ============================================================
-- Circles RLS Update
-- ============================================================
-- Relaxes the INSERT policy on circle_members so any member
-- can invite new people (not just the creator). Adds DELETE
-- policies for leaving and creator removal.
-- ============================================================

-- Drop the restrictive creator-only insert policy
drop policy if exists "Circle creator can add members" on circle_members;

-- Any circle member can add new members
create policy "Circle members can add members"
  on circle_members for insert
  to authenticated
  with check (
    circle_id in (
      select circle_id from circle_members where user_id = auth.uid()
    )
    -- Also allow the circle creator to add the first members
    or circle_id in (
      select id from circles where created_by = auth.uid()
    )
  );

-- Members can leave (delete their own row)
create policy "Members can leave circles"
  on circle_members for delete
  to authenticated
  using (user_id = auth.uid());

-- Circle creator can remove any member
create policy "Creator can remove members"
  on circle_members for delete
  to authenticated
  using (
    circle_id in (
      select id from circles where created_by = auth.uid()
    )
  );

-- Circle creator can delete the circle
create policy "Creator can delete circles"
  on circles for delete
  to authenticated
  using (created_by = auth.uid());

-- Circle creator can update the circle name
create policy "Creator can update circles"
  on circles for update
  to authenticated
  using (created_by = auth.uid());

-- Add index on circle_members.circle_id for join performance
create index if not exists circle_members_circle_id_idx
  on circle_members(circle_id);
