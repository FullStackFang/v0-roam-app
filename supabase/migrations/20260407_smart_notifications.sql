-- ============================================================
-- Smart Notifications: decay, audience-awareness, contextual
-- ============================================================

-- ── notification_log: decay tracking ─────────────────────────
create table if not exists notification_log (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references profiles(id) on delete cascade,
  broadcast_id  uuid not null references status_broadcasts(id) on delete cascade,
  notif_type    text not null,  -- 'join', 'omw', 'nearby'
  created_at    timestamptz not null default now()
);

create index if not exists notif_log_recipient_broadcast_idx
  on notification_log(recipient_id, broadcast_id);

-- Add notification prefs column to profiles
alter table profiles
  add column if not exists notifications_muted boolean not null default false;

-- ── Updated: notify_on_join with join_type + decay ───────────
create or replace function notify_on_join()
returns trigger
language plpgsql
security definer
as $$
declare
  v_owner_id uuid;
  v_owner_token text;
  v_owner_muted boolean;
  v_joiner_name text;
  v_join_type text;
  v_notif_count int;
  v_title text;
  v_body text;
  v_notif_type text;
begin
  -- Get broadcast owner info
  select sb.user_id, p.push_token, p.notifications_muted
  into v_owner_id, v_owner_token, v_owner_muted
  from status_broadcasts sb
  join profiles p on p.id = sb.user_id
  where sb.id = NEW.broadcast_id
    and sb.expires_at > now()
    and p.push_token is not null;

  if v_owner_token is null or v_owner_muted then return NEW; end if;

  -- Decay: max 3 notifications per broadcast per recipient
  select count(*) into v_notif_count
  from notification_log
  where recipient_id = v_owner_id
    and broadcast_id = NEW.broadcast_id;

  if v_notif_count >= 3 then return NEW; end if;

  select display_name into v_joiner_name from profiles where id = NEW.user_id;
  v_join_type := coalesce(NEW.join_type, 'joined');

  if v_join_type = 'on_my_way' then
    v_title := 'On the way!';
    v_body := coalesce(v_joiner_name, 'Someone') || ' is heading your way';
    v_notif_type := 'omw';
  else
    v_title := 'Someone joined!';
    v_body := coalesce(v_joiner_name, 'Someone') || ' joined your broadcast';
    v_notif_type := 'join';
  end if;

  -- Log for decay
  insert into notification_log (recipient_id, broadcast_id, notif_type)
  values (v_owner_id, NEW.broadcast_id, v_notif_type);

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json'
    ),
    body := jsonb_build_object(
      'to', v_owner_token,
      'title', v_title,
      'body', v_body,
      'data', jsonb_build_object('type', v_notif_type, 'broadcast_id', NEW.broadcast_id),
      'sound', 'default',
      'channelId', 'joins'
    )
  );

  return NEW;
end;
$$;

-- ── Updated: notify_nearby with audience + decay + time ──────
create or replace function notify_nearby_on_broadcast()
returns trigger
language plpgsql
security definer
as $$
declare
  v_name text;
  v_rec record;
  v_count int := 0;
  v_hour int;
  v_notif_count int;
begin
  if NEW.lat is null or NEW.lng is null then return NEW; end if;

  -- Time-awareness: don't notify for "tonight" broadcasts before 5pm
  v_hour := extract(hour from now());
  if NEW.duration in ('tonight', 'until_2am') and v_hour < 17 then return NEW; end if;

  select display_name into v_name from profiles where id = NEW.user_id;

  for v_rec in
    select p.id as profile_id, p.push_token
    from profiles p
    where p.push_token is not null
      and p.id != NEW.user_id
      and p.notifications_muted = false
      and p.last_known_lat is not null
      and ST_DWithin(
        ST_MakePoint(p.last_known_lng, p.last_known_lat)::geography,
        ST_MakePoint(NEW.lng, NEW.lat)::geography,
        1500
      )
      -- Audience: if circle-targeted, only notify circle members
      and (
        NEW.audience_type = 'everyone'
        or NEW.audience_circle_id in (
          select circle_id from circle_members where user_id = p.id
        )
      )
  loop
    -- Decay: max 3 notifications from this broadcast to this recipient
    select count(*) into v_notif_count
    from notification_log
    where recipient_id = v_rec.profile_id
      and broadcast_id = NEW.id;

    if v_notif_count >= 3 then continue; end if;

    insert into notification_log (recipient_id, broadcast_id, notif_type)
    values (v_rec.profile_id, NEW.id, 'nearby');

    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
      ),
      body := jsonb_build_object(
        'to', v_rec.push_token,
        'title', 'Activity nearby',
        'body', coalesce(v_name, 'Someone') || ' is out near you',
        'data', jsonb_build_object('type', 'nearby', 'broadcast_id', NEW.id),
        'sound', 'default',
        'channelId', 'nearby'
      )
    );
    v_count := v_count + 1;
    exit when v_count >= 50;
  end loop;

  return NEW;
end;
$$;
