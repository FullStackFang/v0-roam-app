-- ============================================================
-- Add join_type to broadcast_joins
-- ============================================================
-- Supports "On my way" vs "Joined" states.
-- Default is 'joined' for backwards compatibility.
-- ============================================================

alter table broadcast_joins
  add column if not exists join_type text not null default 'joined'
  check (join_type in ('joined', 'on_my_way'));
